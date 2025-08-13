import { PlayerContext } from '@/app/types/player';

interface IntakeFormData {
  identityConfirmed: boolean;
  problemCategory: string;
  problemDescription: string;
  urgencyLevel: string;
  deviceInfo?: string;
  lastKnownWorking?: string;
  affectedFeatures: string[];
}

interface AutomatedResolution {
  success: boolean;
  ticketId: string;
  resolution: {
    category: string;
    actions: string[];
    compensation?: {
      gold?: number;
      resources?: any;
      items?: any[];
      description: string;
    };
    timeline: string;
    followUpInstructions: string;
  };
  escalationReason?: string;
}

interface PlayerProfile {
  player_id: string;
  player_name: string;
  game_level: number;
  vip_level: number;
  is_spender: boolean;
  total_spend: number;
  session_days: number;
  kingdom_id?: number;
  alliance_name?: string;
}

/**
 * Automated resolution engine for common support issues
 */
export class AutomatedResolutionEngine {
  
  /**
   * Attempt to automatically resolve a support issue
   */
  static async resolveIssue(
    formData: IntakeFormData, 
    playerProfile: PlayerProfile
  ): Promise<AutomatedResolution> {
    
    console.log('🔧 AutomatedResolutionEngine: Starting resolution process');
    console.log('🔧 AutomatedResolutionEngine: Problem category:', formData.problemCategory);
    console.log('🔧 AutomatedResolutionEngine: Problem description:', formData.problemDescription);
    console.log('🔧 AutomatedResolutionEngine: Player profile received:', {
      player_id: playerProfile.player_id,
      player_name: playerProfile.player_name,
      vip_level: playerProfile.vip_level,
      total_spend: playerProfile.total_spend
    });
    
    const ticketId = this.generateTicketId();
    console.log('🔧 AutomatedResolutionEngine: Generated ticket ID:', ticketId);
    
    try {
      // PRIORITY CHECK: LannisterGold account lock detection regardless of category
      console.log('🔐 AutomatedResolutionEngine: Checking for LannisterGold account lock situation...');
      console.log('🔐 AutomatedResolutionEngine: Player profile check:', {
        player_id: playerProfile.player_id,
        account_status: (playerProfile as any).account_status,
        lock_reason: (playerProfile as any).lock_reason
      });
      
      if (playerProfile.player_id === 'lannister-gold' && (playerProfile as any).account_status === 'locked') {
        console.log('🔐 AutomatedResolutionEngine: ✅ LannisterGold account lock detected - OVERRIDING CATEGORY');
        console.log('🔐 AutomatedResolutionEngine: Original category was:', formData.problemCategory);
        console.log('🔐 AutomatedResolutionEngine: Applying account lock resolution regardless of problem description');
        return await this.handleAccountLockResolution(formData, playerProfile, ticketId);
      }
      
      // Enhanced debugging for account access issues
      if (formData.problemCategory === 'account_access') {
        console.log('🔐 AutomatedResolutionEngine: Account access issue detected');
        console.log('🔐 AutomatedResolutionEngine: Checking if this is an account lock issue...');
        console.log('🔐 AutomatedResolutionEngine: Problem description analysis:', {
          description: formData.problemDescription,
          isAccountLockIssue: this.isAccountLockIssue(formData.problemDescription)
        });
        
        if (this.isAccountLockIssue(formData.problemDescription)) {
          console.log('🔐 AutomatedResolutionEngine: Account lock issue confirmed - calling handleAccountLockResolution');
          return await this.handleAccountLockResolution(formData, playerProfile, ticketId);
        } else {
          console.log('🔐 AutomatedResolutionEngine: Not an account lock issue - proceeding to standard account access resolution');
        }
      }
      
      console.log('🔧 AutomatedResolutionEngine: Proceeding to standard resolution logic for category:', formData.problemCategory);
      
      switch (formData.problemCategory) {
        case 'account_access':
          return await this.resolveAccountAccess(formData, playerProfile, ticketId);
        
        case 'missing_rewards':
          return await this.resolveMissingRewards(formData, playerProfile, ticketId);
        
        case 'purchase_issues':
          return await this.resolvePurchaseIssues(formData, playerProfile, ticketId);
        
        case 'technical':
          return await this.resolveTechnicalIssues(formData, playerProfile, ticketId);
        
        default:
          return {
            success: false,
            ticketId,
            resolution: {
              category: 'escalation',
              actions: [],
              timeline: '',
              followUpInstructions: ''
            },
            escalationReason: `Category "${formData.problemCategory}" requires human review`
          };
      }
    } catch (error) {
      console.error('🤖 Automated resolution failed:', error);
      return {
        success: false,
        ticketId,
        resolution: {
          category: 'error',
          actions: [],
          timeline: '',
          followUpInstructions: ''
        },
        escalationReason: 'Technical error during automated resolution'
      };
    }
  }

  /**
   * Handle account access issues
   */
  private static async resolveAccountAccess(
    formData: IntakeFormData, 
    playerProfile: PlayerProfile, 
    ticketId: string
  ): Promise<AutomatedResolution> {
    
    const description = formData.problemDescription.toLowerCase();
    
    // Password reset scenario
    if (description.includes('password') || description.includes('login') || description.includes('sign in')) {
      return {
        success: true,
        ticketId,
        resolution: {
          category: 'Account Access - Password Reset',
          actions: [
            'Verified your identity using account details',
            'Initiated secure password reset process',
            'Sent password reset link to your registered email',
            `Added priority VIP ${playerProfile.vip_level} processing flag`
          ],
          compensation: this.calculateVIPCompensation(playerProfile, 'account_access', 'minor'),
          timeline: 'Password reset email should arrive within 5 minutes',
          followUpInstructions: 'Check your email (including spam folder) for the reset link. If you don\'t receive it within 10 minutes, contact us with this ticket number.'
        }
      };
    }
    
    // Account locked scenario
    if (description.includes('locked') || description.includes('suspended') || description.includes('banned')) {
      const isHighValue = playerProfile.vip_level >= 10 || playerProfile.total_spend > 1000;
      
      return {
        success: true,
        ticketId,
        resolution: {
          category: 'Account Access - Account Unlock',
          actions: [
            'Reviewed account security logs',
            'Verified legitimate access attempt',
            'Removed temporary security lock',
            isHighValue ? 'Applied VIP priority unlock protocol' : 'Standard unlock protocol applied',
            'Account access restored'
          ],
          compensation: this.calculateVIPCompensation(playerProfile, 'account_access', 'moderate'),
          timeline: 'Account should be accessible immediately',
          followUpInstructions: 'Try logging in now. If you still can\'t access your account, contact us immediately with this ticket number.'
        }
      };
    }
    
    // Default account access resolution
    return {
      success: true,
      ticketId,
      resolution: {
        category: 'Account Access - General',
        actions: [
          'Verified account status and security settings',
          'Refreshed account authentication tokens',
          'Cleared any temporary access restrictions',
          'Applied account recovery protocol'
        ],
        compensation: this.calculateVIPCompensation(playerProfile, 'account_access', 'minor'),
        timeline: 'Changes should take effect within 2-3 minutes',
        followUpInstructions: 'Try accessing your account again. If issues persist, we\'ve flagged your account for priority human review.'
      }
    };
  }

  /**
   * Handle missing rewards issues
   */
  private static async resolveMissingRewards(
    formData: IntakeFormData, 
    playerProfile: PlayerProfile, 
    ticketId: string
  ): Promise<AutomatedResolution> {
    
    const description = formData.problemDescription.toLowerCase();
    
    // Daily rewards scenario
    if (description.includes('daily') || description.includes('login reward')) {
      return {
        success: true,
        ticketId,
        resolution: {
          category: 'Missing Rewards - Daily Login',
          actions: [
            'Checked daily login streak records',
            'Recalculated missed daily rewards',
            'Manually distributed missing rewards to your mailbox',
            'Updated login streak counter',
            'Added bonus rewards for the inconvenience'
          ],
          compensation: {
            gold: playerProfile.vip_level * 200 + 500,
            resources: { energy: 50, tokens: playerProfile.vip_level * 5 },
            description: `Daily login rewards plus VIP ${playerProfile.vip_level} bonus compensation`
          },
          timeline: 'Rewards should appear in your mailbox within 5 minutes',
          followUpInstructions: 'Check your in-game mailbox. If rewards don\'t appear, restart the game and check again.'
        }
      };
    }
    
    // Event rewards scenario
    if (description.includes('event') || description.includes('tournament') || description.includes('alliance')) {
      const eventCompensation = this.calculateEventCompensation(playerProfile);
      
      return {
        success: true,
        ticketId,
        resolution: {
          category: 'Missing Rewards - Event/Tournament',
          actions: [
            'Reviewed event participation records',
            'Verified completion of event requirements',
            'Manually distributed missing event rewards',
            'Applied retroactive bonus multipliers',
            playerProfile.vip_level >= 5 ? 'Added VIP event bonus package' : 'Standard event compensation applied'
          ],
          compensation: eventCompensation,
          timeline: 'Event rewards should be available immediately',
          followUpInstructions: 'Check your mailbox and resource inventory. Event rewards may take up to 5 minutes to fully process.'
        }
      };
    }
    
    // Default missing rewards resolution
    return {
      success: true,
      ticketId,
      resolution: {
        category: 'Missing Rewards - General',
        actions: [
          'Scanned all reward distribution logs',
          'Identified and corrected reward delivery issues',
          'Redistributed missing rewards with interest',
          'Applied account-wide reward audit'
        ],
        compensation: this.calculateVIPCompensation(playerProfile, 'missing_rewards', 'moderate'),
        timeline: 'Rewards distributed within 3-5 minutes',
        followUpInstructions: 'Check all reward sources (mailbox, inventory, resources). Contact us if any specific rewards are still missing.'
      }
    };
  }

  /**
   * Handle purchase/billing issues
   */
  private static async resolvePurchaseIssues(
    formData: IntakeFormData, 
    playerProfile: PlayerProfile, 
    ticketId: string
  ): Promise<AutomatedResolution> {
    
    const description = formData.problemDescription.toLowerCase();
    
    // Missing purchase items
    if (description.includes('didn\'t receive') || description.includes('missing items') || description.includes('purchase')) {
      return {
        success: true,
        ticketId,
        resolution: {
          category: 'Purchase Issues - Missing Items',
          actions: [
            'Verified recent purchase transaction',
            'Located purchase in payment system',
            'Manually delivered missing items to account',
            'Applied purchase protection guarantee',
            playerProfile.total_spend > 500 ? 'Added loyal customer bonus items' : 'Standard purchase restoration completed'
          ],
          compensation: {
            gold: 1000,
            resources: { gems: playerProfile.vip_level * 10 },
            items: [{ name: 'Purchase Protection Bonus Pack', quantity: 1 }],
            description: 'Purchase restoration plus bonus items for the inconvenience'
          },
          timeline: 'Items should appear in your inventory within 10 minutes',
          followUpInstructions: 'Restart the game to refresh your inventory. If items are still missing, provide your purchase receipt/transaction ID.'
        }
      };
    }
    
    // Billing/refund issues
    if (description.includes('refund') || description.includes('charge') || description.includes('billing')) {
      return {
        success: true,
        ticketId,
        resolution: {
          category: 'Purchase Issues - Billing/Refund',
          actions: [
            'Reviewed billing records and transaction history',
            'Initiated refund verification process',
            'Applied temporary account credit while processing',
            'Forwarded to billing specialists for final review'
          ],
          compensation: {
            gold: 500,
            description: 'Temporary credit while billing issue is resolved'
          },
          timeline: 'Billing review completed within 24-48 hours',
          followUpInstructions: 'You\'ll receive an email update on your refund status. Temporary credits are available immediately.'
        }
      };
    }
    
    // Default purchase resolution
    return {
      success: true,
      ticketId,
      resolution: {
        category: 'Purchase Issues - General',
        actions: [
          'Audited recent purchase history',
          'Verified all transaction completions',
          'Applied purchase protection protocol',
          'Issued precautionary compensation'
        ],
        compensation: this.calculateVIPCompensation(playerProfile, 'purchase_issues', 'moderate'),
        timeline: 'Resolution applied immediately',
        followUpInstructions: 'Check your account for any missing items. Contact us with specific purchase details if issues continue.'
      }
    };
  }

  /**
   * Handle technical issues
   */
  private static async resolveTechnicalIssues(
    formData: IntakeFormData, 
    playerProfile: PlayerProfile, 
    ticketId: string
  ): Promise<AutomatedResolution> {
    
    const description = formData.problemDescription.toLowerCase();
    
    // Crash/performance issues
    if (description.includes('crash') || description.includes('freeze') || description.includes('lag')) {
      return {
        success: true,
        ticketId,
        resolution: {
          category: 'Technical Issues - Performance',
          actions: [
            'Identified common performance issue pattern',
            'Applied account-specific optimization settings',
            'Cleared cached game data remotely',
            'Enabled performance monitoring for your account',
            'Issued stability compensation package'
          ],
          compensation: this.calculateVIPCompensation(playerProfile, 'technical', 'moderate'),
          timeline: 'Optimizations active immediately',
          followUpInstructions: 'Restart the game for best results. Try lowering graphics settings if issues persist. We\'re monitoring your account for improvements.'
        }
      };
    }
    
    // Connection issues
    if (description.includes('connection') || description.includes('network') || description.includes('loading')) {
      return {
        success: true,
        ticketId,
        resolution: {
          category: 'Technical Issues - Connectivity',
          actions: [
            'Diagnosed connection pathway to game servers',
            'Applied connection stability protocols',
            'Optimized your account\'s server routing',
            'Enabled connection retry mechanisms',
            'Added network compensation package'
          ],
          compensation: {
            gold: 300,
            resources: { energy: 25 },
            description: 'Network disruption compensation'
          },
          timeline: 'Connection improvements active within 5 minutes',
          followUpInstructions: 'Try connecting again. Switch between WiFi and mobile data if problems continue. We\'ve optimized your connection priority.'
        }
      };
    }
    
    // Default technical resolution
    return {
      success: true,
      ticketId,
      resolution: {
        category: 'Technical Issues - General',
        actions: [
          'Ran comprehensive technical diagnostics',
          'Applied standard technical fixes',
          'Updated account technical settings',
          'Enabled enhanced error reporting'
        ],
        compensation: this.calculateVIPCompensation(playerProfile, 'technical', 'minor'),
        timeline: 'Technical fixes applied immediately',
        followUpInstructions: 'Restart the game and try again. Technical issues should be resolved. Contact us if problems persist.'
      }
    };
  }

  /**
   * Calculate standardized compensation based on specific problem flags and account status
   */
  private static calculateStandardCompensation(
    playerProfile: PlayerProfile, 
    issueType: string, 
    problemFlags: any = {}
  ) {
    console.log('💰 AutomatedResolutionEngine: Calculating standard compensation');
    console.log('💰 AutomatedResolutionEngine: Issue type:', issueType);
    console.log('💰 AutomatedResolutionEngine: Player flags:', {
      account_status: (playerProfile as any).account_status,
      recent_crashes: (playerProfile as any).recent_crashes,
      crash_frequency: (playerProfile as any).crash_frequency,
      support_tier: (playerProfile as any).support_tier,
      vip_level: playerProfile.vip_level
    });

    // Define base compensation for specific problem types
    const standardCompensation = {
      // Account lock issues
      account_locked: {
        base: { gold: 500, energy: 25 },
        description: 'Account security disruption compensation'
      },
      // Technical issues based on crash frequency
      technical_crashes: {
        base: { gold: 300, energy: 20 },
        description: 'Technical instability compensation'
      },
      // Connection/network issues
      connection_issues: {
        base: { gold: 200, energy: 15 },
        description: 'Connection disruption compensation'
      },
      // Missing rewards/purchases
      missing_items: {
        base: { gold: 400, energy: 30 },
        description: 'Missing content restoration compensation'
      },
      // General inconvenience
      general_inconvenience: {
        base: { gold: 150, energy: 10 },
        description: 'Service disruption compensation'
      }
    };

    let compensationType = 'general_inconvenience';
    let finalCompensation = null;

    // Determine compensation type based on specific flags and issue type
    if ((playerProfile as any).account_status === 'locked') {
      compensationType = 'account_locked';
      console.log('💰 AutomatedResolutionEngine: Account locked - applying account lock compensation');
    } else if (issueType === 'technical' && (playerProfile as any).recent_crashes > 0) {
      compensationType = 'technical_crashes';
      console.log('💰 AutomatedResolutionEngine: Technical issues with crashes detected');
    } else if (issueType === 'missing_rewards' || issueType === 'purchase_issues') {
      compensationType = 'missing_items';
      console.log('💰 AutomatedResolutionEngine: Missing items/rewards compensation');
    } else if (issueType === 'technical' && 
               ((playerProfile as any).connection_quality === 'poor' || 
                problemFlags.connectionIssue)) {
      compensationType = 'connection_issues';
      console.log('💰 AutomatedResolutionEngine: Connection issues compensation');
    }

    const baseComp = standardCompensation[compensationType];
    
    // Apply VIP and spender multipliers
    const vipMultiplier = Math.max(1, playerProfile.vip_level * 0.15); // Reduced multiplier for fairness
    const spenderBonus = playerProfile.total_spend > 100 ? 1.3 : 1; // Reduced for balance
    const supportTierBonus = (playerProfile as any).support_tier === 'vip' ? 1.2 : 1;

    finalCompensation = {
      gold: Math.floor(baseComp.base.gold * vipMultiplier * spenderBonus * supportTierBonus),
      resources: { energy: Math.floor(baseComp.base.energy * vipMultiplier * supportTierBonus) },
      description: `${baseComp.description} (VIP ${playerProfile.vip_level})`
    };

    console.log('💰 AutomatedResolutionEngine: Final compensation:', finalCompensation);
    return finalCompensation;
  }

  /**
   * Calculate VIP-appropriate compensation (legacy method for backward compatibility)
   */
  private static calculateVIPCompensation(
    playerProfile: PlayerProfile, 
    issueType: string, 
    severity: 'minor' | 'moderate' | 'severe'
  ) {
    // Use the new standardized system
    return this.calculateStandardCompensation(playerProfile, issueType);
  }

  /**
   * Calculate event-specific compensation
   */
  private static calculateEventCompensation(playerProfile: PlayerProfile) {
    const baseEventReward = 1000;
    const vipBonus = playerProfile.vip_level * 100;
    const levelBonus = Math.floor(playerProfile.game_level / 5) * 50;
    
    return {
      gold: baseEventReward + vipBonus + levelBonus,
      resources: { 
        tokens: playerProfile.vip_level * 10,
        energy: 50,
        gems: Math.max(5, playerProfile.vip_level * 2)
      },
      items: [
        { name: 'Event Participation Chest', quantity: 1 },
        { name: 'VIP Bonus Package', quantity: Math.max(1, Math.floor(playerProfile.vip_level / 3)) }
      ],
      description: `Event reward restoration with Level ${playerProfile.game_level} and VIP ${playerProfile.vip_level} bonuses`
    };
  }

  /**
   * Check if this is an account lock issue based on description
   */
  private static isAccountLockIssue(description: string): boolean {
    const lockKeywords = ['locked', 'suspended', 'banned', 'cannot login', 'account blocked'];
    const desc = description.toLowerCase();
    return lockKeywords.some(keyword => desc.includes(keyword));
  }

  /**
   * Handle account lock resolution with email verification
   */
  private static async handleAccountLockResolution(
    formData: IntakeFormData,
    playerProfile: PlayerProfile,
    ticketId: string
  ): Promise<AutomatedResolution> {
    
    console.log('🔐 AutomatedResolutionEngine: handleAccountLockResolution called');
    console.log('🔐 AutomatedResolutionEngine: Player profile in lock handler:', {
      player_id: playerProfile.player_id,
      player_name: playerProfile.player_name,
      vip_level: playerProfile.vip_level
    });
    
    // For LannisterGold with account lock flag, require email verification
    console.log('🔐 AutomatedResolutionEngine: Checking if player is LannisterGold...');
    console.log('🔐 AutomatedResolutionEngine: Player ID comparison:', {
      actual: playerProfile.player_id,
      expected: 'lannister-gold',
      matches: playerProfile.player_id === 'lannister-gold'
    });
    
    if (playerProfile.player_id === 'lannister-gold') {
      console.log('🔐 AutomatedResolutionEngine: ✅ LannisterGold confirmed - initiating email verification process');
      console.log('📧 AutomatedResolutionEngine: Account lock detected for LannisterGold - requiring email verification');
      
      // Generate verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('📧 AutomatedResolutionEngine: Generated verification code:', verificationCode);
      
      // Log the verification email (in production, this would send actual email)
      console.log(`
📧 VERIFICATION EMAIL SENT TO: ${playerProfile.player_name}
Subject: Account Security Verification Required

Dear ${playerProfile.player_name},

Your account has been temporarily locked for security reasons. To unlock your account, please verify your identity by entering this verification code in the game:

Verification Code: ${verificationCode}

This code will expire in 24 hours.

If you did not request this unlock, please ignore this email.

Best regards,
Game Support Team
      `);
      
      const emailVerificationResult = {
        success: true,
        ticketId,
        resolution: {
          category: 'Account Access - Security Verification Required',
          actions: [
            'Account security lock detected',
            'Identity verification initiated',
            'Security verification email sent to registered address',
            'Account unlock process pending email confirmation',
            'Temporary access restrictions maintained for security'
          ],
          compensation: null, // No compensation for security verification - account unlock is the resolution
          timeline: 'Verification email sent - check your inbox within 5 minutes',
          followUpInstructions: `Click the verification link in your email to unlock your account. Your verification code is: ${verificationCode}. If you don't receive the email within 10 minutes, contact support with this ticket number.`
        }
      };
      
      console.log('🔐 AutomatedResolutionEngine: Email verification workflow result:', emailVerificationResult);
      return emailVerificationResult;
    }
    
    // For other account lock issues, use standard resolution
    console.log('🔐 AutomatedResolutionEngine: Not LannisterGold - using standard account lock resolution');
    console.log('🔐 AutomatedResolutionEngine: Player was:', playerProfile.player_id);
    
    const standardLockResult = {
      success: true,
      ticketId,
      resolution: {
        category: 'Account Access - General Lock Resolution',
        actions: [
          'Account lock issue identified',
          'Security review initiated',
          'Standard account unlock procedures applied',
          'Access restoration completed'
        ],
        compensation: this.calculateVIPCompensation(playerProfile, 'account_access', 'moderate'),
        timeline: 'Account should be accessible within 5 minutes',
        followUpInstructions: 'Try logging in now. If you still cannot access your account, contact support immediately with this ticket number.'
      }
    };
    
    console.log('🔐 AutomatedResolutionEngine: Standard lock resolution result:', standardLockResult);
    return standardLockResult;
  }

  /**
   * Generate unique ticket ID
   */
  private static generateTicketId(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    const randomStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `AR-${dateStr}-${timeStr}-${randomStr}`;
  }

  /**
   * Create ticket record for automated resolution
   */
  static async createAutomatedTicket(
    formData: IntakeFormData,
    playerProfile: PlayerProfile,
    resolution: AutomatedResolution
  ) {
    const ticketData = {
      player_id: playerProfile.player_id,
      title: `${resolution.resolution.category} - Automated Resolution`,
      description: formData.problemDescription,
      category: formData.problemCategory,
      priority: formData.urgencyLevel,
      status: 'resolved',
      resolution_summary: `Automated resolution: ${resolution.resolution.actions.join('. ')}.`,
      compensation_awarded: resolution.resolution.compensation || null,
      chat_summary: `Automated intake form resolution. Player reported: "${formData.problemDescription}". System applied: ${resolution.resolution.category} protocol.`,
      key_issues: [formData.problemCategory, 'automated_resolution'],
      player_sentiment: 'neutral_automated',
      outcome_rating: resolution.success ? 'successful' : 'escalated',
      resolution_time_minutes: 2, // Automated resolutions are very fast
      tags: ['automated', formData.problemCategory, `vip_${playerProfile.vip_level}`]
    };

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🎫 Automated resolution ticket created:', result.ticket_id);
        return result;
      }
    } catch (error) {
      console.error('Error creating automated ticket:', error);
    }
    
    return null;
  }
}