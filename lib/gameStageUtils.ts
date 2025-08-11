/**
 * Game stage utilities for determining player progression stage
 * based on their game level.
 */

export enum GameStage {
  NewRecruit = "New Recruit",
  BuddingLord = "Budding Lord",
  StrategicRuler = "Strategic Ruler",
  KingdomRises = "Kingdom Rises",
  HighCouncil = "High Council",
  WardenOfRealm = "Warden of the Realm",
  IronThrone = "Iron Throne Contender"
}

/**
 * Get the player's game stage based on their level
 * @param level - Player's current game level
 * @returns The corresponding game stage as a string
 */
export function getGameStage(level: number): string {
  if (level <= 5) {
    return GameStage.NewRecruit;
  } else if (level <= 10) {
    return GameStage.BuddingLord;
  } else if (level <= 15) {
    return GameStage.StrategicRuler;
  } else if (level <= 20) {
    return GameStage.KingdomRises;
  } else if (level <= 25) {
    return GameStage.HighCouncil;
  } else if (level <= 30) {
    return GameStage.WardenOfRealm;
  } else {
    return GameStage.IronThrone;
  }
} 