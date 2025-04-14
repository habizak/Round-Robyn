/**
 * Round Robin Tournament Scheduler
 * This module handles the generation of tournament schedules
 * for Singles, Fixed Doubles, and Random Doubles match types.
 */
class TournamentScheduler {
  /**
   * Create a new tournament scheduler
   * @param {Object} options - Configuration options
   * @param {string[]} options.players - List of player names
   * @param {number} options.courts - Number of courts available
   * @param {string} options.matchType - Type of matches (singles, fixed-doubles, random-doubles)
   * @param {number} options.winningPoints - Points needed to win a match
   */
  constructor(options) {
      this.players = options.players;
      this.courts = options.courts;
      this.matchType = options.matchType;
      this.winningPoints = options.winningPoints;
      this.schedule = [];
      this.matches = [];
      this.courtNames = options.courtNames && options.courtNames.length === this.courts
          ? options.courtNames
          : Array(this.courts).fill(0).map((_, i) => `Court ${i + 1}`);
  }

  /**
   * Generate the tournament schedule
   * @returns {Object} The complete tournament schedule
   */
  generateSchedule() {
      switch (this.matchType) {
          case 'singles':
              return this.generateSinglesSchedule();
          case 'fixed-doubles':
              return this.generateFixedDoublesSchedule();
          case 'random-doubles':
              return this.generateRandomDoublesSchedule();
          default:
              throw new Error('Invalid match type specified');
      }
  }

  /**
   * Generate a singles round robin tournament schedule
   * @returns {Object} The singles tournament schedule
   */
  generateSinglesSchedule() {
      let players = [...this.players];
      const numOriginalPlayers = players.length;
      let byePlayer = null;
      
      // Track byes for distribution
      const byeCounts = {};
      players.forEach(player => byeCounts[player] = 0);
      
      // If odd number of players, prepare for bye rotation
      if (players.length % 2 !== 0) {
          players.push("BYE");
          byePlayer = "BYE";
      }
      
      const numPlayers = players.length;
      const numRounds = numPlayers - 1;
      const matchesPerRound = numPlayers / 2;
      
      // Initialize schedule rounds
      let rounds = [];
      
      // Generate rounds using the Circle Method (Berger Tables algorithm)
      for (let round = 0; round < numRounds; round++) {
          let matchups = [];
          let byePlayerForRound = null;
          
          for (let match = 0; match < matchesPerRound; match++) {
              // Calculate indices using the Circle Method
              let player1Index = match;
              let player2Index = numPlayers - 1 - match;
              
              // If there's a BYE involved
              if (players[player1Index] === "BYE" || players[player2Index] === "BYE") {
                  // Record which player gets a bye this round
                  byePlayerForRound = players[player1Index] === "BYE" ? 
                      players[player2Index] : players[player1Index];
              } else {
                  // Regular match between two players
                  matchups.push({
                      id: `R${round+1}-M${match+1}`,
                      player1: players[player1Index],
                      player2: players[player2Index],
                      score1: null,
                      score2: null,
                      completed: false,
                      courtAssigned: false
                  });
              }
          }
          
          rounds.push(matchups);
          
          // Rotate players for next round (keep first player fixed)
          const fixed = players[0];
          const rotated = players.slice(1);
          rotated.unshift(rotated.pop()); // Rotate
          players = [fixed, ...rotated];
      }
      
      // Assign courts to matches
      this.assignCourtsToMatches(rounds);
      
      // Prepare final schedule
      let schedule = rounds.map((matches, roundIndex) => {
          return {
              round: roundIndex + 1,
              matches: matches
          };
      });
      
      this.schedule = schedule;
      return {
          players: this.players,
          courts: this.courts,
          courtNames: this.courtNames,
          matchType: this.matchType,
          winningPoints: this.winningPoints,
          schedule: schedule
      };
  }

  /**
   * Generate a fixed doubles round robin tournament schedule
   * @returns {Object} The fixed doubles tournament schedule
   */
  generateFixedDoublesSchedule() {
      // Ensure even number of players
      if (this.players.length % 2 !== 0) {
          throw new Error("Fixed doubles requires an even number of players");
      }
      
      // Create fixed teams - players are locked in pairs for the entire tournament
      const teams = [];
      for (let i = 0; i < this.players.length; i += 2) {
          teams.push(`${this.players[i]} / ${this.players[i + 1]}`);
      }
      
      // Store original teams for result
      const originalTeams = [...teams];
      
      // If odd number of teams, add a "BYE" team
      if (teams.length % 2 !== 0) {
          teams.push("BYE");
      }
      
      const numTeams = teams.length;
      const numRounds = numTeams - 1;
      const matchesPerRound = numTeams / 2;
      
      // Initialize schedule rounds
      let rounds = [];
      
      // Generate rounds using the Circle Method for teams (Berger Tables)
      for (let round = 0; round < numRounds; round++) {
          let matchups = [];
          let byeTeamForRound = null;
          
          for (let match = 0; match < matchesPerRound; match++) {
              // Calculate indices using the Circle Method
              let team1Index = match;
              let team2Index = numTeams - 1 - match;
              
              // If there's a BYE involved
              if (teams[team1Index] === "BYE" || teams[team2Index] === "BYE") {
                  // Record which team gets a bye this round
                  byeTeamForRound = teams[team1Index] === "BYE" ? 
                      teams[team2Index] : teams[team1Index];
              } else {
                  // Regular match between two teams
                  matchups.push({
                      id: `R${round+1}-M${match+1}`,
                      player1: teams[team1Index],
                      player2: teams[team2Index],
                      score1: null,
                      score2: null,
                      completed: false,
                      courtAssigned: false
                  });
              }
          }
          
          rounds.push(matchups);
          
          // Rotate teams for next round (keep first team fixed)
          const fixed = teams[0];
          const rotated = teams.slice(1);
          rotated.unshift(rotated.pop()); // Rotate
          teams = [fixed, ...rotated];
      }
      
      // Assign courts to matches - distribute evenly across available courts
      this.assignCourtsToMatches(rounds);
      
      // Prepare final schedule
      let schedule = rounds.map((matches, roundIndex) => {
          return {
              round: roundIndex + 1,
              matches: matches
          };
      });
      
      this.schedule = schedule;
      return {
          players: this.players,
          courts: this.courts,
          courtNames: this.courtNames,
          matchType: this.matchType,
          winningPoints: this.winningPoints,
          schedule: schedule,
          teams: originalTeams  // Return the original teams for reference
      };
  }

  /**
   * Generate a random doubles round robin tournament schedule
   * @returns {Object} The random doubles tournament schedule
   */
  generateRandomDoublesSchedule() {
      const numPlayers = this.players.length;
      const rounds = [];
      
      // Ensure at least 4 players
      if (numPlayers < 4) {
          throw new Error("Random doubles requires at least 4 players");
      }
      
      // Maximum number of rounds possible
      const maxRounds = this.calculateMaxRandomDoublesRounds(numPlayers);
      
      // Track which players have sat out
      const byeCounts = {};
      this.players.forEach(player => byeCounts[player] = 0);
      
      // Track partner history to maximize variety
      const partnerHistory = {};
      this.players.forEach(player => {
          partnerHistory[player] = {};
          this.players.forEach(partner => {
              if (player !== partner) {
                  partnerHistory[player][partner] = 0;
              }
          });
      });
      
      // Generate each round
      for (let round = 0; round < maxRounds; round++) {
          // Deep copy of players to shuffle
          let availablePlayers = [...this.players];
          const matches = [];
          
          // If odd number of players, pick someone to sit out
          // Prioritize players who have sat out less often
          if (availablePlayers.length % 2 !== 0) {
              // Sort players by how often they've sat out
              const sortedForBye = [...availablePlayers].sort((a, b) => byeCounts[a] - byeCounts[b]);
              // Select player with least byes to sit out
              const byePlayer = sortedForBye[0];
              // Remove bye player from available players
              availablePlayers = availablePlayers.filter(p => p !== byePlayer);
              // Update bye count
              byeCounts[byePlayer]++;
          }
          
          // For each round, we need to create optimal pairings
          // to ensure players get to play with different partners
          const pairings = this.createOptimalPairings(availablePlayers, partnerHistory);
          
          // Create matches from pairings
          for (let i = 0; i < pairings.length; i += 2) {
              if (i + 1 < pairings.length) {
                  const team1 = pairings[i];
                  const team2 = pairings[i + 1];
                  
                  // Update partner history
                  this.updatePartnerHistory(team1, team2, partnerHistory);
                  
                  // Add match to schedule
                  matches.push({
                      id: `R${round+1}-M${matches.length+1}`,
                      player1: `${team1[0]} / ${team1[1]}`,
                      player2: `${team2[0]} / ${team2[1]}`,
                      score1: null,
                      score2: null,
                      completed: false,
                      courtAssigned: false
                  });
              }
          }
          
          rounds.push(matches);
      }
      
      // Assign courts to matches
      this.assignCourtsToMatches(rounds);
      
      // Prepare final schedule
      let schedule = rounds.map((matches, roundIndex) => {
          return {
              round: roundIndex + 1,
              matches: matches
          };
      });
      
      this.schedule = schedule;
      return {
          players: this.players,
          courts: this.courts,
          courtNames: this.courtNames,
          matchType: this.matchType,
          winningPoints: this.winningPoints,
          schedule: schedule
      };
  }
  
  /**
   * Create optimal pairings for random doubles
   * @param {Array} players - Available players
   * @param {Object} partnerHistory - History of partnerships
   * @returns {Array} Array of paired teams
   */
  createOptimalPairings(players, partnerHistory) {
      // Shuffle players first for initial randomness
      const shuffledPlayers = this.shuffleArray([...players]);
      const teams = [];
      const usedPlayers = new Set();
      
      // First pass - pair players who haven't played together before or least often
      for (let i = 0; i < shuffledPlayers.length; i++) {
          const player1 = shuffledPlayers[i];
          
          if (usedPlayers.has(player1)) continue;
          
          // Find best partner (least played with)
          let bestPartner = null;
          let lowestPartnerCount = Infinity;
          
          for (let j = 0; j < shuffledPlayers.length; j++) {
              const player2 = shuffledPlayers[j];
              
              if (player1 === player2 || usedPlayers.has(player2)) continue;
              
              const partnerCount = partnerHistory[player1][player2] || 0;
              
              if (partnerCount < lowestPartnerCount) {
                  lowestPartnerCount = partnerCount;
                  bestPartner = player2;
              }
          }
          
          if (bestPartner) {
              teams.push([player1, bestPartner]);
              usedPlayers.add(player1);
              usedPlayers.add(bestPartner);
          }
      }
      
      // If any players left, pair them randomly
      const remainingPlayers = shuffledPlayers.filter(p => !usedPlayers.has(p));
      for (let i = 0; i < remainingPlayers.length; i += 2) {
          if (i + 1 < remainingPlayers.length) {
              teams.push([remainingPlayers[i], remainingPlayers[i + 1]]);
          }
      }
      
      return teams;
  }
  
  /**
   * Update partner history after matches are created
   * @param {Array} team1 - First team [player1, player2]
   * @param {Array} team2 - Second team [player3, player4]
   * @param {Object} partnerHistory - Partner history object to update
   */
  updatePartnerHistory(team1, team2, partnerHistory) {
      // Update partner counts
      partnerHistory[team1[0]][team1[1]] = (partnerHistory[team1[0]][team1[1]] || 0) + 1;
      partnerHistory[team1[1]][team1[0]] = (partnerHistory[team1[1]][team1[0]] || 0) + 1;
      
      partnerHistory[team2[0]][team2[1]] = (partnerHistory[team2[0]][team2[1]] || 0) + 1;
      partnerHistory[team2[1]][team2[0]] = (partnerHistory[team2[1]][team2[0]] || 0) + 1;
  }

  /**
   * Calculate maximum possible rounds for random doubles
   * @param {number} numPlayers - Number of players
   * @returns {number} Maximum number of rounds
   */
  calculateMaxRandomDoublesRounds(numPlayers) {
      // For random doubles, we typically want enough rounds for good variety
      // but not too many to make the tournament too long
      if (numPlayers <= 4) {
          return 3; // Small group, just a few rounds
      } else if (numPlayers <= 8) {
          return 5; // Medium group
      } else {
          return 7; // Larger groups
      }
  }

  /**
   * Assign courts to matches across all rounds
   * @param {Array} rounds - Tournament rounds with matches
   */
  assignCourtsToMatches(rounds) {
      if (!this.courts || this.courts < 1) {
          console.error("Invalid courts count detected, defaulting to 1");
          this.courts = 1;
          this.courtNames = ["Court 1"];
      }

      console.log(`Assigning matches to ${this.courts} courts`);

      rounds.forEach((matches, roundIndex) => {
          console.log(`Round ${roundIndex+1}: ${matches.length} matches to distribute across ${this.courts} courts`);

          let courtCounter = 0;

          matches.forEach((match, matchIndex) => {
              const courtIndex = matchIndex % this.courts;

              match.court = courtIndex + 1;
              match.courtName = this.courtNames[courtIndex];
              match.courtAssigned = true;

              console.log(`Assigned match ${match.id}: ${match.player1} vs ${match.player2} to court ${match.court} (${match.courtName})`);
          });
      });
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   * @param {Array} array - The array to shuffle
   * @returns {Array} The shuffled array
   */
  shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
  }

  /**
   * Update the score for a specific match
   * @param {number} roundIndex - Round index
   * @param {number} matchIndex - Match index
   * @param {number} score1 - Score for player/team 1
   * @param {number} score2 - Score for player/team 2
   */
  updateMatchScore(roundIndex, matchIndex, score1, score2) {
      if (!this.schedule[roundIndex] || !this.schedule[roundIndex].matches[matchIndex]) {
          throw new Error("Invalid round or match index");
      }
      
      const match = this.schedule[roundIndex].matches[matchIndex];
      match.score1 = score1;
      match.score2 = score2;
      match.completed = true;
      
      return this.schedule;
  }

  /**
   * Generate standings from match results
   * @returns {Array} Player/team standings
   */
  generateStandings() {
      const standings = {};
      
      // Initialize standings for all players/teams
      if (this.matchType === 'singles') {
          this.players.forEach(player => {
              standings[player] = {
                  name: player,
                  matches: 0,
                  wins: 0,
                  losses: 0,
                  pointsFor: 0,
                  pointsAgainst: 0,
                  pointDiff: 0
              };
          });
      } else {
          // For doubles, extract unique teams from matches
          const teams = new Set();
          this.schedule.forEach(round => {
              round.matches.forEach(match => {
                  teams.add(match.player1);
                  teams.add(match.player2);
              });
          });
          
          teams.forEach(team => {
              if (team !== "BYE") {
                  standings[team] = {
                      name: team,
                      matches: 0,
                      wins: 0,
                      losses: 0,
                      pointsFor: 0,
                      pointsAgainst: 0,
                      pointDiff: 0
                  };
              }
          });
      }
      
      // Process completed matches
      this.schedule.forEach(round => {
          round.matches.forEach(match => {
              if (match.completed) {
                  // Update player/team 1 stats
                  if (standings[match.player1]) {
                      standings[match.player1].matches++;
                      standings[match.player1].pointsFor += match.score1;
                      standings[match.player1].pointsAgainst += match.score2;
                      
                      if (match.score1 > match.score2) {
                          standings[match.player1].wins++;
                      } else {
                          standings[match.player1].losses++;
                      }
                  }
                  
                  // Update player/team 2 stats
                  if (standings[match.player2]) {
                      standings[match.player2].matches++;
                      standings[match.player2].pointsFor += match.score2;
                      standings[match.player2].pointsAgainst += match.score1;
                      
                      if (match.score2 > match.score1) {
                          standings[match.player2].wins++;
                      } else {
                          standings[match.player2].losses++;
                      }
                  }
              }
          });
      });
      
      // Calculate point differential
      Object.values(standings).forEach(player => {
          player.pointDiff = player.pointsFor - player.pointsAgainst;
      });
      
      // Convert to array and sort
      const standingsArray = Object.values(standings).filter(s => s.name !== "BYE");
      
      // Sort by wins (desc), then point differential (desc)
      standingsArray.sort((a, b) => {
          if (b.wins !== a.wins) {
              return b.wins - a.wins;
          }
          return b.pointDiff - a.pointDiff;
      });
      
      return standingsArray;
  }

  /**
   * Update court names
   * @param {string[]} newCourtNames - Updated court names
   */
  updateCourtNames(newCourtNames) {
      if (newCourtNames.length !== this.courts) {
          throw new Error("Number of court names must match number of courts");
      }
      
      this.courtNames = newCourtNames;
      
      // Update court names in all matches
      this.schedule.forEach(round => {
          round.matches.forEach(match => {
              if (match.court && match.court <= this.courts) {
                  match.courtName = this.courtNames[match.court - 1];
              }
          });
      });
      
      return this.schedule;
  }

  /**
   * Update player names
   * @param {Object} nameMapping - Mapping of old names to new names
   */
  updatePlayerNames(nameMapping) {
      // Create a copy of the original players array
      const updatedPlayers = [...this.players];
      
      // Update player names in the players array
      for (let i = 0; i < updatedPlayers.length; i++) {
          const oldName = updatedPlayers[i];
          if (nameMapping[oldName]) {
              updatedPlayers[i] = nameMapping[oldName];
          }
      }
      
      this.players = updatedPlayers;
      
      // Update player names in all matches
      this.schedule.forEach(round => {
          round.matches.forEach(match => {
              // For singles
              if (this.matchType === 'singles') {
                  if (nameMapping[match.player1]) {
                      match.player1 = nameMapping[match.player1];
                  }
                  if (nameMapping[match.player2]) {
                      match.player2 = nameMapping[match.player2];
                  }
              } else {
                  // For doubles, need to update team names
                  const updateTeamName = (teamName) => {
                      const players = teamName.split(" / ");
                      const updatedPlayers = players.map(p => nameMapping[p] || p);
                      return updatedPlayers.join(" / ");
                  };
                  
                  match.player1 = updateTeamName(match.player1);
                  match.player2 = updateTeamName(match.player2);
              }
          });
      });
      
      return {
          players: this.players,
          schedule: this.schedule
      };
  }
}

function updateTournamentSummary() {
    const matchType = document.getElementById('match-type').value;
    // Use the courts array length instead of trying to read from an element
    const numCourts = courts.length;
    let winningPoints;
    
    if (winningPointsSelect.value === 'custom') {
        winningPoints = parseInt(customPointsInput.value);
    } else {
        winningPoints = parseInt(winningPointsSelect.value);
    }
    
    let matchTypeDisplay = 'Singles';
    if (matchType === 'fixed-doubles') matchTypeDisplay = 'Fixed Doubles';
    if (matchType === 'random-doubles') matchTypeDisplay = 'Random Doubles';
    
    let summary = `
        <ul class="list-group">
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Players
                <span class="badge bg-primary rounded-pill">${players.length}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Courts
                <span class="badge bg-primary rounded-pill">${numCourts}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Match Type
                <span class="badge bg-primary rounded-pill">${matchTypeDisplay}</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                Winning Points
                <span class="badge bg-primary rounded-pill">${winningPoints}</span>
            </li>
        </ul>
    `;
    
    tournamentSummary.innerHTML = summary;
}
