const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get user profile (public view)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userType: true,
        profilePicture: true,
        bio: true,
        location: true,
        website: true,
        linkedinUrl: true,
        twitterUrl: true,
        companyName: true,
        jobTitle: true,
        industry: true,
        skills: true,
        languages: true,
        timezone: true,
        isVerified: true,
        profileViews: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            sentMessages: true,
            receivedMessages: true,
            teamMemberships: true,
            ownedTeams: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Increment profile views (if not viewing own profile)
    const viewerId = req.user?.id;
    if (viewerId && viewerId !== parseInt(userId)) {
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { profileViews: { increment: 1 } }
      });
    }

    res.json({
      success: true,
      profile: {
        ...user,
        stats: {
          listings: user._count.listings,
          messages: user._count.sentMessages + user._count.receivedMessages,
          teams: user._count.teamMemberships + user._count.ownedTeams
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

// Get current user's full profile
router.get('/me/full', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        listings: {
          select: { id: true, title: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        teamMemberships: {
          include: {
            team: {
              select: { id: true, name: true, type: true }
            }
          }
        },
        ownedTeams: {
          select: { id: true, name: true, type: true, _count: { select: { members: true } } }
        },
        _count: {
          select: {
            listings: true,
            sentMessages: true,
            receivedMessages: true,
            teamMemberships: true,
            ownedTeams: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      profile: {
        ...user,
        stats: {
          listings: user._count.listings,
          messages: user._count.sentMessages + user._count.receivedMessages,
          teams: user._count.teamMemberships + user._count.ownedTeams
        }
      }
    });
  } catch (error) {
    console.error('Error fetching full profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      bio,
      location,
      website,
      linkedinUrl,
      twitterUrl,
      companyName,
      jobTitle,
      industry,
      skills,
      languages,
      timezone,
      phoneNumber,
      dateOfBirth,
      gender,
      preferredLanguage
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(website !== undefined && { website }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(twitterUrl !== undefined && { twitterUrl }),
        ...(companyName !== undefined && { companyName }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(industry !== undefined && { industry }),
        ...(skills !== undefined && { skills }),
        ...(languages !== undefined && { languages }),
        ...(timezone !== undefined && { timezone }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        ...(gender !== undefined && { gender }),
        ...(preferredLanguage !== undefined && { preferredLanguage })
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userType: true,
        profilePicture: true,
        bio: true,
        location: true,
        website: true,
        linkedinUrl: true,
        twitterUrl: true,
        companyName: true,
        jobTitle: true,
        industry: true,
        skills: true,
        languages: true,
        timezone: true,
        phoneNumber: true,
        dateOfBirth: true,
        gender: true,
        preferredLanguage: true,
        isVerified: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Upload profile picture
router.post('/me/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const profilePicture = `/uploads/profiles/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePicture },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePicture: true
      }
    });

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      profilePicture: updatedUser.profilePicture,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture'
    });
  }
});

// Get user's activity feed
router.get('/me/activity', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get recent activities (simplified version - in production you'd have an activities table)
    const activities = [];

    // Recent listings
    const recentListings = await prisma.listing.findMany({
      where: { userId },
      select: { id: true, title: true, createdAt: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    recentListings.forEach(listing => {
      activities.push({
        id: `listing-${listing.id}`,
        type: 'listing_created',
        title: 'Created new listing',
        description: listing.title,
        timestamp: listing.createdAt,
        data: { listingId: listing.id, status: listing.status }
      });
    });

    // Recent team activities
    const recentTeamMemberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: { select: { id: true, name: true } }
      },
      orderBy: { joinedAt: 'desc' },
      take: 5
    });

    recentTeamMemberships.forEach(membership => {
      activities.push({
        id: `team-${membership.id}`,
        type: 'team_joined',
        title: 'Joined team',
        description: membership.team.name,
        timestamp: membership.joinedAt,
        data: { teamId: membership.team.id, role: membership.role }
      });
    });

    // Sort activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Paginate
    const paginatedActivities = activities.slice(skip, skip + limit);

    res.json({
      success: true,
      activities: paginatedActivities,
      pagination: {
        page,
        limit,
        total: activities.length,
        pages: Math.ceil(activities.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity feed'
    });
  }
});

// Get user's connections/network
router.get('/me/connections', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get team connections
    const teamConnections = await prisma.teamMember.findMany({
      where: {
        userId,
        status: 'active'
      },
      include: {
        team: {
          include: {
            members: {
              where: { userId: { not: userId } },
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profilePicture: true,
                    companyName: true,
                    jobTitle: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const connections = [];
    const uniqueUserIds = new Set();

    teamConnections.forEach(membership => {
      membership.team.members.forEach(member => {
        if (!uniqueUserIds.has(member.user.id)) {
          uniqueUserIds.add(member.user.id);
          connections.push({
            ...member.user,
            connectionType: 'team',
            teamName: membership.team.name,
            teamId: membership.team.id
          });
        }
      });
    });

    res.json({
      success: true,
      connections,
      totalConnections: connections.length
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connections'
    });
  }
});

// Search users/profiles
router.get('/search', async (req, res) => {
  try {
    const { q, industry, location, userType, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      AND: [
        ...(q ? [{
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { companyName: { contains: q, mode: 'insensitive' } },
            { jobTitle: { contains: q, mode: 'insensitive' } },
            { bio: { contains: q, mode: 'insensitive' } }
          ]
        }] : []),
        ...(industry ? [{ industry: { contains: industry, mode: 'insensitive' } }] : []),
        ...(location ? [{ location: { contains: location, mode: 'insensitive' } }] : []),
        ...(userType ? [{ userType }] : [])
      ]
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          companyName: true,
          jobTitle: true,
          industry: true,
          location: true,
          bio: true,
          isVerified: true,
          userType: true,
          _count: {
            select: { listings: true }
          }
        },
        orderBy: [
          { isVerified: 'desc' },
          { profileViews: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      users: users.map(user => ({
        ...user,
        listingsCount: user._count.listings
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error searching profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search profiles'
    });
  }
});

// Get profile analytics (for profile owner)
router.get('/me/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profileViews: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            sentMessages: true,
            receivedMessages: true,
            teamMemberships: true,
            ownedTeams: true
          }
        }
      }
    });

    // Calculate profile completion percentage
    const userDetails = await prisma.user.findUnique({
      where: { id: userId }
    });

    const requiredFields = [
      'firstName', 'lastName', 'bio', 'location', 'companyName', 
      'jobTitle', 'industry', 'profilePicture'
    ];
    
    const completedFields = requiredFields.filter(field => 
      userDetails[field] && userDetails[field].toString().trim() !== ''
    );
    
    const profileCompletion = Math.round((completedFields.length / requiredFields.length) * 100);

    res.json({
      success: true,
      analytics: {
        profileViews: user.profileViews || 0,
        profileCompletion,
        memberSince: user.createdAt,
        stats: {
          listings: user._count.listings,
          messagesSent: user._count.sentMessages,
          messagesReceived: user._count.receivedMessages,
          teamsJoined: user._count.teamMemberships,
          teamsOwned: user._count.ownedTeams
        },
        missingFields: requiredFields.filter(field => 
          !userDetails[field] || userDetails[field].toString().trim() === ''
        )
      }
    });
  } catch (error) {
    console.error('Error fetching profile analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile analytics'
    });
  }
});

module.exports = router;
