const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const prisma = new PrismaClient();

// Get user's teams
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true }
            }
          }
        },
        _count: {
          select: { members: true, projects: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      teams: teams.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        type: team.type,
        status: team.status,
        owner: team.owner,
        memberCount: team._count.members,
        projectCount: team._count.projects,
        members: team.members.map(member => ({
          id: member.id,
          role: member.role,
          joinedAt: member.joinedAt,
          user: member.user
        })),
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams'
    });
  }
});

// Create new team
router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, type = 'business' } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }

    const team = await prisma.team.create({
      data: {
        name,
        description,
        type,
        ownerId: userId,
        status: 'active'
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true }
        },
        _count: {
          select: { members: true, projects: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        type: team.type,
        status: team.status,
        owner: team.owner,
        memberCount: team._count.members,
        projectCount: team._count.projects,
        members: [],
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      }
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create team'
    });
  }
});

// Get team details
router.get('/:teamId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamId } = req.params;

    const team = await prisma.team.findFirst({
      where: {
        id: parseInt(teamId),
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true }
            }
          },
          orderBy: { joinedAt: 'asc' }
        },
        projects: {
          select: { id: true, name: true, description: true, status: true, createdAt: true }
        },
        _count: {
          select: { members: true, projects: true }
        }
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or access denied'
      });
    }

    res.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        type: team.type,
        status: team.status,
        owner: team.owner,
        memberCount: team._count.members,
        projectCount: team._count.projects,
        members: team.members.map(member => ({
          id: member.id,
          role: member.role,
          joinedAt: member.joinedAt,
          user: member.user
        })),
        projects: team.projects,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching team details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team details'
    });
  }
});

// Update team
router.put('/:teamId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamId } = req.params;
    const { name, description, type, status } = req.body;

    // Check if user is team owner
    const team = await prisma.team.findFirst({
      where: {
        id: parseInt(teamId),
        ownerId: userId
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or you are not the owner'
      });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: parseInt(teamId) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(status && { status })
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true }
        },
        _count: {
          select: { members: true, projects: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Team updated successfully',
      team: {
        id: updatedTeam.id,
        name: updatedTeam.name,
        description: updatedTeam.description,
        type: updatedTeam.type,
        status: updatedTeam.status,
        owner: updatedTeam.owner,
        memberCount: updatedTeam._count.members,
        projectCount: updatedTeam._count.projects,
        createdAt: updatedTeam.createdAt,
        updatedAt: updatedTeam.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update team'
    });
  }
});

// Invite member to team
router.post('/:teamId/invite', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamId } = req.params;
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user is team owner or admin
    const team = await prisma.team.findFirst({
      where: {
        id: parseInt(teamId),
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId, role: { in: ['admin', 'owner'] } } } }
        ]
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or insufficient permissions'
      });
    }

    // Find user by email
    const invitedUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    if (!invitedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: parseInt(teamId),
        userId: invitedUser.id
      }
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this team'
      });
    }

    // Create team member
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId: parseInt(teamId),
        userId: invitedUser.id,
        role,
        status: 'active'
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true }
        }
      }
    });

    // Create notification for invited user
    await prisma.notification.create({
      data: {
        userId: invitedUser.id,
        type: 'team_invitation',
        title: 'Team Invitation',
        message: `You have been invited to join the team "${team.name}"`,
        data: JSON.stringify({
          teamId: team.id,
          teamName: team.name,
          invitedBy: req.user.firstName + ' ' + req.user.lastName
        })
      }
    });

    res.status(201).json({
      success: true,
      message: 'Member invited successfully',
      member: {
        id: teamMember.id,
        role: teamMember.role,
        status: teamMember.status,
        joinedAt: teamMember.joinedAt,
        user: teamMember.user
      }
    });
  } catch (error) {
    console.error('Error inviting team member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invite team member'
    });
  }
});

// Update member role
router.put('/:teamId/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamId, memberId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    // Check if user is team owner or admin
    const team = await prisma.team.findFirst({
      where: {
        id: parseInt(teamId),
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId, role: { in: ['admin', 'owner'] } } } }
        ]
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or insufficient permissions'
      });
    }

    const updatedMember = await prisma.teamMember.update({
      where: { id: parseInt(memberId) },
      data: { role },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, profilePicture: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Member role updated successfully',
      member: {
        id: updatedMember.id,
        role: updatedMember.role,
        status: updatedMember.status,
        joinedAt: updatedMember.joinedAt,
        user: updatedMember.user
      }
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update member role'
    });
  }
});

// Remove member from team
router.delete('/:teamId/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamId, memberId } = req.params;

    // Check if user is team owner or admin, or removing themselves
    const member = await prisma.teamMember.findFirst({
      where: { id: parseInt(memberId) },
      include: { team: true }
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    const canRemove = member.team.ownerId === userId || 
                     member.userId === userId || 
                     await prisma.teamMember.findFirst({
                       where: {
                         teamId: parseInt(teamId),
                         userId: userId,
                         role: { in: ['admin', 'owner'] }
                       }
                     });

    if (!canRemove) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to remove this member'
      });
    }

    await prisma.teamMember.delete({
      where: { id: parseInt(memberId) }
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove team member'
    });
  }
});

// Delete team (owner only)
router.delete('/:teamId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { teamId } = req.params;

    const team = await prisma.team.findFirst({
      where: {
        id: parseInt(teamId),
        ownerId: userId
      }
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or you are not the owner'
      });
    }

    // Delete team and all related data (cascade)
    await prisma.team.delete({
      where: { id: parseInt(teamId) }
    });

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete team'
    });
  }
});

module.exports = router;
