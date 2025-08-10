const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get team overview and statistics
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Simulated team overview data
    const teamOverview = {
      totalMembers: 8,
      activeMembers: 7,
      pendingInvites: 2,
      roles: {
        admin: 1,
        manager: 2,
        member: 4,
        viewer: 1
      },
      recentActivity: [
        {
          id: 1,
          type: 'member_added',
          user: 'Sarah Johnson',
          action: 'joined the team',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          role: 'Manager'
        },
        {
          id: 2,
          type: 'role_changed',
          user: 'Mike Chen',
          action: 'role updated to Manager',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          role: 'Manager'
        },
        {
          id: 3,
          type: 'permission_updated',
          user: 'Alex Rivera',
          action: 'permissions updated',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          role: 'Member'
        }
      ],
      performance: {
        teamEfficiency: 87,
        collaborationScore: 92,
        responseTime: 2.3,
        tasksCompleted: 156,
        activeProjects: 12
      }
    };

    res.json({ overview: teamOverview });
  } catch (error) {
    console.error('Error fetching team overview:', error);
    res.status(500).json({ error: 'Failed to fetch team overview' });
  }
});

// Get all team members
router.get('/members', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, role, status } = req.query;
    
    // Simulated team members data
    const allMembers = [
      {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@company.com',
        role: 'Admin',
        status: 'active',
        avatar: null,
        joinDate: new Date('2024-01-15'),
        lastActive: new Date(Date.now() - 30 * 60 * 1000),
        permissions: ['all'],
        department: 'Management',
        location: 'New York, USA',
        phone: '+1 (555) 123-4567',
        skills: ['Leadership', 'Strategy', 'Management']
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        role: 'Manager',
        status: 'active',
        avatar: null,
        joinDate: new Date('2024-02-01'),
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
        permissions: ['team_management', 'project_management', 'reports'],
        department: 'Operations',
        location: 'London, UK',
        phone: '+44 20 7123 4567',
        skills: ['Project Management', 'Team Leadership', 'Analytics']
      },
      {
        id: 3,
        name: 'Mike Chen',
        email: 'mike.chen@company.com',
        role: 'Manager',
        status: 'active',
        avatar: null,
        joinDate: new Date('2024-02-15'),
        lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000),
        permissions: ['team_management', 'client_management'],
        department: 'Sales',
        location: 'Singapore',
        phone: '+65 6123 4567',
        skills: ['Sales', 'Client Relations', 'Negotiation']
      },
      {
        id: 4,
        name: 'Alex Rivera',
        email: 'alex.rivera@company.com',
        role: 'Member',
        status: 'active',
        avatar: null,
        joinDate: new Date('2024-03-01'),
        lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000),
        permissions: ['project_access', 'client_communication'],
        department: 'Development',
        location: 'Toronto, Canada',
        phone: '+1 (416) 123-4567',
        skills: ['Development', 'Problem Solving', 'Communication']
      },
      {
        id: 5,
        name: 'Emma Wilson',
        email: 'emma.wilson@company.com',
        role: 'Member',
        status: 'active',
        avatar: null,
        joinDate: new Date('2024-03-15'),
        lastActive: new Date(Date.now() - 8 * 60 * 60 * 1000),
        permissions: ['project_access', 'reports'],
        department: 'Marketing',
        location: 'Sydney, Australia',
        phone: '+61 2 1234 5678',
        skills: ['Marketing', 'Content Creation', 'Analytics']
      },
      {
        id: 6,
        name: 'David Kim',
        email: 'david.kim@company.com',
        role: 'Member',
        status: 'inactive',
        avatar: null,
        joinDate: new Date('2024-04-01'),
        lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
        permissions: ['project_access'],
        department: 'Support',
        location: 'Seoul, South Korea',
        phone: '+82 2 1234 5678',
        skills: ['Customer Support', 'Technical Writing', 'Problem Solving']
      },
      {
        id: 7,
        name: 'Lisa Zhang',
        email: 'lisa.zhang@company.com',
        role: 'Member',
        status: 'active',
        avatar: null,
        joinDate: new Date('2024-04-15'),
        lastActive: new Date(Date.now() - 3 * 60 * 60 * 1000),
        permissions: ['project_access', 'client_communication'],
        department: 'Design',
        location: 'Shanghai, China',
        phone: '+86 21 1234 5678',
        skills: ['UI/UX Design', 'Creative Thinking', 'User Research']
      },
      {
        id: 8,
        name: 'James Brown',
        email: 'james.brown@company.com',
        role: 'Viewer',
        status: 'active',
        avatar: null,
        joinDate: new Date('2024-05-01'),
        lastActive: new Date(Date.now() - 12 * 60 * 60 * 1000),
        permissions: ['view_only'],
        department: 'Consulting',
        location: 'Miami, USA',
        phone: '+1 (305) 123-4567',
        skills: ['Consulting', 'Business Analysis', 'Research']
      }
    ];

    // Filter by role and status if provided
    let filteredMembers = allMembers;
    if (role && role !== 'all') {
      filteredMembers = filteredMembers.filter(member => 
        member.role.toLowerCase() === role.toLowerCase()
      );
    }
    if (status && status !== 'all') {
      filteredMembers = filteredMembers.filter(member => member.status === status);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

    res.json({
      members: paginatedMembers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredMembers.length / limit),
        totalMembers: filteredMembers.length,
        hasNext: endIndex < filteredMembers.length,
        hasPrev: startIndex > 0
      }
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// Get team roles and permissions
router.get('/roles', async (req, res) => {
  try {
    const roles = [
      {
        id: 'admin',
        name: 'Admin',
        description: 'Full access to all features and settings',
        permissions: [
          'all_access',
          'user_management',
          'role_management',
          'billing_access',
          'settings_access',
          'delete_access'
        ],
        memberCount: 1,
        color: '#dc2626'
      },
      {
        id: 'manager',
        name: 'Manager',
        description: 'Manage team members and projects',
        permissions: [
          'team_management',
          'project_management',
          'client_management',
          'reports_access',
          'invite_members'
        ],
        memberCount: 2,
        color: '#2563eb'
      },
      {
        id: 'member',
        name: 'Member',
        description: 'Access to assigned projects and tasks',
        permissions: [
          'project_access',
          'task_management',
          'client_communication',
          'file_upload',
          'reports_view'
        ],
        memberCount: 4,
        color: '#059669'
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access to projects and reports',
        permissions: [
          'view_only',
          'reports_view',
          'project_view'
        ],
        memberCount: 1,
        color: '#7c3aed'
      }
    ];

    res.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Get pending invitations
router.get('/invitations', async (req, res) => {
  try {
    const invitations = [
      {
        id: 1,
        email: 'new.member@company.com',
        role: 'Member',
        invitedBy: 'John Smith',
        invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'pending',
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        email: 'consultant@company.com',
        role: 'Viewer',
        invitedBy: 'Sarah Johnson',
        invitedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'pending',
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
      }
    ];

    res.json({ invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// Invite new team member
router.post('/invite', async (req, res) => {
  try {
    const { email, role, message } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // In production, this would:
    // 1. Create invitation record in database
    // 2. Send invitation email
    // 3. Set expiration date

    const invitation = {
      id: Date.now(),
      email,
      role,
      invitedBy: req.user.name || 'Current User',
      invitedAt: new Date(),
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      message
    };

    res.json({ 
      success: true, 
      invitation,
      message: 'Invitation sent successfully' 
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Update team member role
router.put('/members/:memberId/role', async (req, res) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    // In production, this would update the database
    res.json({ 
      success: true, 
      message: `Member role updated to ${role}`,
      memberId,
      newRole: role
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// Remove team member
router.delete('/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    const userId = req.user.id;

    // In production, this would:
    // 1. Remove member from database
    // 2. Revoke access permissions
    // 3. Send notification

    res.json({ 
      success: true, 
      message: 'Team member removed successfully',
      memberId
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

// Cancel invitation
router.delete('/invitations/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.id;

    // In production, this would remove invitation from database
    res.json({ 
      success: true, 
      message: 'Invitation cancelled successfully',
      invitationId
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ error: 'Failed to cancel invitation' });
  }
});

// Get team analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const analytics = {
      teamGrowth: {
        current: 8,
        previous: 6,
        growth: 33.3,
        trend: 'up'
      },
      productivity: {
        tasksCompleted: 156,
        averageResponseTime: 2.3,
        collaborationScore: 92,
        efficiency: 87
      },
      engagement: {
        activeMembers: 7,
        dailyActiveUsers: 6.2,
        weeklyActiveUsers: 7.8,
        monthlyActiveUsers: 8
      },
      performance: [
        { month: 'Jan', productivity: 78, engagement: 85 },
        { month: 'Feb', productivity: 82, engagement: 88 },
        { month: 'Mar', productivity: 85, engagement: 90 },
        { month: 'Apr', productivity: 87, engagement: 92 },
        { month: 'May', productivity: 89, engagement: 94 }
      ],
      topPerformers: [
        { name: 'Sarah Johnson', score: 96, role: 'Manager' },
        { name: 'Mike Chen', score: 94, role: 'Manager' },
        { name: 'Alex Rivera', score: 91, role: 'Member' }
      ]
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching team analytics:', error);
    res.status(500).json({ error: 'Failed to fetch team analytics' });
  }
});

module.exports = router;