import { ExternalSources } from '../types/externalSources';

export function getExternalSourcesContent(scenarioType: string): ExternalSources {
  switch(scenarioType) {
    case "new-player":
    case "tutorial_crash":
      return {
        discord: {
          threadName: "#technical-support",
          userCount: 28,
          messages: [
            { user: "@JonSnow123", message: "Game keeps crashing during tutorial when upgrading the keep. Can't progress at all. #bug" },
            { user: "@TechWizard", message: "What device are you using? This seems to be happening on older Android devices especially." },
            { user: "@NewPlayerHelp", message: "I found a workaround - if you clear cache and disable special effects before that tutorial step, it works." },
            { user: "@GameDevJohn", message: "We're tracking this tutorial crash issue. It appears related to the latest graphics update and memory allocation during the keep upgrade animation." }
          ]
        },
        reddit: {
          subreddit: "DragonRealmsMMO",
          title: "Tutorial Crash During Keep Upgrade - Can't Progress",
          upvotes: 412,
          body: "Brand new player here. Every time I get to the tutorial step where you upgrade your keep to level 2, the game crashes. I've reinstalled three times, restarted my phone, and still can't get past this point. Really frustrating as a new player who just spent money on the starter pack!",
          comments: [
            { user: "JonSnow123", comment: "Having this exact issue on my device. Tried all troubleshooting and opened support ticket #TU-54321." },
            { user: "DragonTamer42", comment: "What device are you using? I had the same problem on my Galaxy S10 but it worked fine when I switched to my tablet." },
            { user: "JonSnow123", comment: "I'm on a Pixel 6. I don't have another device to try it on unfortunately." },
            { user: "DeviceTester", comment: "It's crashing because of a memory leak in the new particle effects. Try going to Settings > Graphics and setting Quality to Low before that step." },
            { user: "TutorialMaster", comment: "This is a widespread issue. I've seen at least 20 new players in our guild with the same problem. For some, changing the graphics settings works, but not for everyone." },
            { user: "JonSnow123", comment: "Tried the low graphics setting but still crashes. This is so frustrating." },
            { user: "GameDeveloper", comment: "We've identified the issue with tutorial crashes and will be deploying a hotfix within 12 hours. In the meantime, try reducing graphic settings." },
            { user: "ReadTheManual", comment: "There's actually a way to skip this tutorial section if you tap on the castle icon three times quickly and then access the menu. It's an old debug feature they never removed." }
          ]
        },
        articleTitle: "KNOWN ISSUE: Tutorial Crash During Keep Upgrade"
      };
    
    case "mid-tier":
    case "alliance_event":
      return {
        discord: {
          threadName: "#alliance-events",
          userCount: 42,
          messages: [
            { user: "@DanyStormborn", message: "Did anyone else not get the Alliance Event rewards? I completed all objectives but no gold reward. #bug" },
            { user: "@StormRider45", message: "Same issue here. Tier 6 alliance member, completed all challenges, but my 1500 gold is missing." },
            { user: "@GuildCoordinator", message: "It seems to be affecting members who reached the final tier late in the event day. Our logs show completion but no rewards." },
            { user: "@GameSupport", message: "We're investigating this issue with the Alliance Event rewards. It appears to affect about 8% of players who completed all tiers." }
          ]
        },
        reddit: {
          subreddit: "DragonRealmsMMO",
          title: "Alliance Event Rewards Missing (Last Night's Event)",
          upvotes: 649,
          body: "Just completed all objectives in yesterday's Alliance Event and didn't receive my 1500 gold reward that everyone else got. I spent 4 hours grinding to reach the final tier, and now I'm the only one in my alliance who didn't get compensated. Has anyone else experienced this? Any fix?",
          comments: [
            { user: "DanyStormborn", comment: "Level 12, VIP 4. Same issue here - completed all 5 tiers but no gold or resource rewards. Ticket #AT-22381 opened." },
            { user: "EventCoordinator", comment: "When exactly did you complete the final tier? It seems like there's a cutoff issue for rewards distribution." },
            { user: "DanyStormborn", comment: "I finished about 30 minutes before the event ended. Had to rush the last few objectives." },
            { user: "EventCoordinator", comment: "That explains it. There seems to be a bug with rewards for players who complete it close to the deadline." },
            { user: "AllianceLeader_Max", comment: "This is happening to about 15% of our alliance members. Seems to affect those who completed the event in the last 2 hours before reset." },
            { user: "DragonsHoarder", comment: "I finished with 3 hours to spare and still didn't get rewards. Already submitted a ticket but no response yet. Anyone know how long support usually takes?" },
            { user: "VeteranPlayer", comment: "Usually 24-48 hours for non-urgent issues. But I'd expect them to resolve this faster since it's affecting a lot of players." },
            { user: "GameDevRep", comment: "We've identified the issue with the event reward distribution system. All affected players will receive their missing rewards plus 20% extra in the next 24 hours." },
            { user: "DragonsHoarder", comment: "Great to hear! Thanks for the update and the extra compensation." }
          ]
        },
        articleTitle: "KNOWN ISSUE: Alliance Event Reward Distribution Failure"
      };
    
    case "high-spender":
    case "account_access":
      return {
        discord: {
          threadName: "#account-help",
          userCount: 31,
          messages: [
            { user: "@LannisterGold", message: "Got a new phone but can't access my account. Using same credentials but keeps saying 'account not found'. Need help ASAP!" },
            { user: "@SecurityHelper", message: "Have you tried the account recovery via email? Sometimes device changes trigger extra security." },
            { user: "@GamerSupport", message: "This is a known issue with the latest game update. Try clearing the app cache or using the web portal to reset your device authorization." },
            { user: "@DevTeamMember", message: "We've identified an issue with account authorization after device changes. Working on a fix now." }
          ]
        },
        reddit: {
          subreddit: "DragonRealmsMMO",
          title: "Can't Access Account on New Phone - Critical Help Needed",
          upvotes: 573,
          body: "Just got a new iPhone 15 Pro and transferred everything over, but can't log into Dragon Realms. I have a major alliance battle in 6 hours and NEED to get in. I've spent over $2000 on this game and support isn't responding. My credentials are correct but it says 'account not found'. Anyone solve this?",
          comments: [
            { user: "LannisterGold", comment: "Level 27, VIP 12 membership. Still locked out after 3 hours. Support ticket #AC-78932 with no response." },
            { user: "SimilarIssue", comment: "Having the exact same problem. Just upgraded to the new iPhone and can't get in. Did you transfer via iCloud backup or direct phone-to-phone?" },
            { user: "LannisterGold", comment: "I did the direct transfer using the iPhone transfer feature. Everything else transferred fine except this game." },
            { user: "SimilarIssue", comment: "Same here. I think it might be related to the device ID changing. The game probably has some security feature tied to your specific device." },
            { user: "TechSupportGuru", comment: "This is happening to many users after the security update. Try using the web portal at dragonrealms.com/recover with your purchase receipt." },
            { user: "LannisterGold", comment: "I'm trying that now. It's asking for the transaction ID from a purchase. Hope this works!" },
            { user: "AccountSpecialist", comment: "If the web portal doesn't work, you can also try contacting them through their Discord. The devs are often more responsive there than through the ticket system." },
            { user: "OfficialGameRep", comment: "We're aware of this login issue affecting users changing devices. Emergency patch being deployed in the next hour." },
            { user: "LannisterGold", comment: "The web portal worked! I'm back in. Thanks everyone for the help. For anyone else with this issue - use your most recent purchase receipt to verify your account." },
            { user: "VIPMember", comment: "Glad it worked! As a fellow VIP player, I'd recommend asking for compensation for the downtime - they're usually good about that." }
          ]
        },
        articleTitle: "KNOWN ISSUE: Account Access After Device Change"
      };
    
    default: // guild_shop scenario or fallback
      return {
        discord: {
          threadName: "#game-issues",
          userCount: 23,
          messages: [
            { user: "@DragonSlayer582", message: "Just hit level 24 and can't access the Legendary Guild Shop. It shows 'Purchase Error' whenever I try to buy anything. #bug" },
            { user: "@Shadowblade99", message: "Same issue here. VIP 6 can't access special items in shop after yesterday's patch v3.8.2" },
            { user: "@GuildLeader_Raven", message: "Our entire guild is experiencing this. Seems to only affect players with Season Pass who recently leveled up." },
            { user: "@GameDev_Marcus", message: "We're tracking this issue. It appears to be related to the new VIP tier rewards system. Working on a fix for the next patch." }
          ]
        },
        reddit: {
          subreddit: "DragonRealmsMMO",
          title: "Guild Shop Bug for VIP Players",
          upvotes: 782,
          body: "Since the v3.8.2 patch, players with VIP status (especially levels 5-7) can't purchase legendary items from the Guild Shop. The transaction shows 'Purchase Error' and sometimes freezes the game completely. I've spent $489.99 on this game and now can't access content I've paid for. Dev team needs to address this ASAP or offer compensation!",
          comments: [
            { user: "DragonSlayer582", comment: "Level 24 here with VIP 6. Same problem started after I leveled up yesterday. Customer support ticket #GT-45892 opened but no response yet." },
            { user: "ShopKeeper", comment: "I've noticed that it only happens with certain legendary items. Were you trying to buy the Dragon Scale Armor by any chance?" },
            { user: "DragonSlayer582", comment: "Yes! The Dragon Scale Armor and the Enchanted Weapons are what I was trying to purchase. Both gave the same error." },
            { user: "ShopKeeper", comment: "Same here. I think it's related to the new Season Pass items that were added in the same update. They probably broke something in the shop database." },
            { user: "VIP_Player", comment: "Anyone try reinstalling? I did a clean install and it didn't help at all. Still can't access any guild shop items." },
            { user: "DragonSlayer582", comment: "Tried reinstalling twice, clearing cache, even logging in on a different device. Nothing works." },
            { user: "GameWhisperer", comment: "This is affecting all players who purchased the Season Pass AND have VIP 5+. The bug is in the new reward tier system implementation." },
            { user: "VIP_Player", comment: "Really hope they fix this soon. Our guild war is this weekend and I needed those weapon upgrades!" },
            { user: "DeveloperResponse", comment: "We're aware of the issue and will be deploying a hotfix within 24 hours. Affected players will receive compensation based on VIP level." },
            { user: "AngryCustomer", comment: "Another update, another bug. This happens every single time they release new content! At least they're addressing it quickly this time." },
            { user: "DragonSlayer582", comment: "I just checked the game again and it's still not working. Has anyone received any updates from support about a timeline?" },
            { user: "GuildMaster", comment: "Just got an email about compensation. Looks like they're giving everyone 2000 gems and 5 legendary item tokens as an apology. Should be in game by tomorrow." }
          ]
        },
        articleTitle: "KNOWN ISSUE: Guild Shop Access Bug"
      };
  }
}

export function getScenarioMetricsNote(scenarioType: string): string {
  switch(scenarioType) {
    case "new-player":
    case "tutorial_crash":
      return "Player seeking help with tutorial crash, basic/low frustration issue. Retention risk for new player.";
    
    case "mid-tier":
    case "alliance_event":
      return "Player falsely claiming missing rewards, medium priority issue. Flagged history of similar claims.";
    
    case "high-spender":
    case "account_access":
      return "VIP 12 player with urgent account access issue. High priority support case with time sensitivity.";
    
    default: // guild_shop scenario
      return "Player reporting known issue with Guild Shop access. Potential for compensation.";
  }
} 