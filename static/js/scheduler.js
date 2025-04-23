/**
 * Tournament Scheduler for Round Robyn
 * Generates round-robin tournament schedules for singles and doubles matches
 */
class TournamentScheduler {
    constructor(options) {
      // Initialize tournament options
      this.players = options.players || [];
      this.courts = options.courts || 1;
      this.courtNames = Array(this.courts).fill(0).map((_, i) => `Court ${i + 1}`);
      this.matchType = options.matchType || 'singles';
      this.winningPoints = options.winningPoints || 11;
      this.schedule = [];
    }
  
    /**
     * Generate the tournament schedule based on matchType
     */
    generateSchedule() {
      if (this.players.length < 2) {
        throw new Error('At least 2 players are required');
      }
  
      if (this.matchType === 'fixed-doubles' && this.players.length % 2 !== 0) {
        throw new Error('Fixed doubles requires an even number of players');
      }
  
      // Clear existing schedule
      this.schedule = [];
  
      // Generate schedule based on match type
      switch (this.matchType) {
        case 'singles':
          this.generateSinglesSchedule();
          break;
        case 'fixed-doubles':
          this.generateFixedDoublesSchedule();
          break;
        case 'random-doubles':
          this.generateRandomDoublesSchedule();
          break;
        default:
          throw new Error('Invalid match type');
      }
  
      return {
        players: this.players,
        courts: this.courts,
        courtNames: this.courtNames,
        matchType: this.matchType,
        winningPoints: this.winningPoints,
        schedule: this.schedule
      };
    }
  
    /**
     * Generate schedule for singles matches
     */
    generateSinglesSchedule() {
      let players = [...this.players];
      
      // If odd number of players, add a dummy player for byes
      const hasBye = players.length % 2 !== 0;
      if (hasBye) {
        players.push('BYE');
      }
  
      const numPlayers = players.length;
      const numRounds = numPlayers - 1;
      const matchesPerRound = Math.floor(numPlayers / 2);
  
      // Create a round-robin schedule using the circle method
      // Keep the first player fixed and rotate the others
      for (let round = 0; round < numRounds; round++) {
        const roundMatches = [];
        const matchId = 1; // Starting match ID for this round
  
        for (let match = 0; match < matchesPerRound; match++) {
          const player1Index = match;
          const player2Index = numPlayers - 1 - match;
  
          const player1 = players[player1Index];
          const player2 = players[player2Index];
  
          // Skip matches with BYE player
          if (player1 !== 'BYE' && player2 !== 'BYE') {
            const courtIndex = match % this.courts;
            roundMatches.push({
              id: `${round + 1}-${match + 1}`,
              player1: player1,
              player2: player2,
              court: courtIndex + 1,
              courtName: this.courtNames[courtIndex],
              completed: false,
              score1: 0,
              score2: 0
            });
          }
        }
  
        // Add the round to the schedule
        this.schedule.push({
          round: round + 1,
          matches: roundMatches
        });
  
        // Rotate players (keep player[0] fixed, rotate others)
        players = [players[0], ...players.slice(2), players[1]];
      }
    }
  
    /**
     * Generate schedule for fixed doubles matches
     */
    generateFixedDoublesSchedule() {
      const numPlayers = this.players.length;
      
      // Create teams of 2 players
      const teams = [];
      for (let i = 0; i < numPlayers; i += 2) {
        teams.push({
          id: `Team ${i/2 + 1}`,
          players: `${this.players[i]} & ${this.players[i+1]}`
        });
      }
  
      const numTeams = teams.length;
      const numRounds = numTeams - 1;
      const matchesPerRound = Math.floor(numTeams / 2);
  
      // Generate rounds using the circle method for teams
      for (let round = 0; round < numRounds; round++) {
        const roundMatches = [];
  
        for (let match = 0; match < matchesPerRound; match++) {
          const team1Index = match;
          const team2Index = numTeams - 1 - match;
  
          const team1 = teams[team1Index];
          const team2 = teams[team2Index];
  
          const courtIndex = match % this.courts;
          roundMatches.push({
            id: `${round + 1}-${match + 1}`,
            player1: team1.players,
            player2: team2.players,
            court: courtIndex + 1,
            courtName: this.courtNames[courtIndex],
            completed: false,
            score1: 0,
            score2: 0
          });
        }
  
        this.schedule.push({
          round: round + 1,
          matches: roundMatches
        });
  
        // Rotate teams (keep team[0] fixed, rotate others)
        teams = [teams[0], ...teams.slice(2), teams[1]];
      }
    }
  
    /**
     * Generate schedule for random doubles matches
     */
    generateRandomDoublesSchedule() {
      const numPlayers = this.players.length;
      const hasBye = numPlayers % 2 !== 0;
      const numRounds = numPlayers - 1; // Ideal number of rounds where each player meets every other player
  
      // Generate rounds of random doubles
      for (let round = 0; round < numRounds; round++) {
        // Shuffle players for this round
        let shuffledPlayers = this.shufflePlayers([...this.players]);
  
        // If odd number of players, one player sits out
        if (hasBye) {
          // The player sitting out is the last in the shuffled list
          shuffledPlayers = shuffledPlayers.slice(0, -1);
        }
  
        const teams = [];
        const roundMatches = [];
  
        // Create random teams for this round
        for (let i = 0; i < shuffledPlayers.length; i += 2) {
          teams.push({
            id: `Team ${i/2 + 1}`,
            players: `${shuffledPlayers[i]} & ${shuffledPlayers[i+1]}`
          });
        }
  
        // Create matches between teams
        const numTeams = teams.length;
        const matchesPerRound = Math.floor(numTeams / 2);
  
        for (let match = 0; match < matchesPerRound; match++) {
          const team1 = teams[match * 2];
          const team2 = teams[match * 2 + 1];
  
          const courtIndex = match % this.courts;
          roundMatches.push({
            id: `${round + 1}-${match + 1}`,
            player1: team1.players,
            player2: team2.players,
            court: courtIndex + 1,
            courtName: this.courtNames[courtIndex],
            completed: false,
            score1: 0,
            score2: 0
          });
        }
  
        this.schedule.push({
          round: round + 1,
          matches: roundMatches
        });
      }
    }
  
    /**
     * Update court names in the schedule
     */
    updateCourtNames(newCourtNames) {
      if (!newCourtNames || newCourtNames.length !== this.courts) {
        throw new Error('Invalid court names array');
      }
  
      this.courtNames = newCourtNames;
  
      // Update court names in existing schedule
      this.schedule.forEach(round => {
        round.matches.forEach(match => {
          const courtIndex = match.court - 1;
          match.courtName = this.courtNames[courtIndex];
        });
      });
    }
  
    /**
     * Update player names in the schedule
     */
    updatePlayerNames(playerNameMapping) {
      // Create a function to replace player names in a string
      const replacePlayerName = (text) => {
        let result = text;
        for (const [oldName, newName] of Object.entries(playerNameMapping)) {
          // Replace full names and in doubles combinations
          const regex = new RegExp(`\\b${oldName}\\b`, 'g');
          result = result.replace(regex, newName);
        }
        return result;
      };
  
      // Update player names in the player array
      const updatedPlayers = this.players.map(player => {
        return playerNameMapping[player] || player;
      });
  
      // Update player names in all matches
      const updatedSchedule = this.schedule.map(round => {
        const updatedMatches = round.matches.map(match => {
          return {
            ...match,
            player1: replacePlayerName(match.player1),
            player2: replacePlayerName(match.player2)
          };
        });
        
        return {
          ...round,
          matches: updatedMatches
        };
      });
  
      return {
        players: updatedPlayers,
        schedule: updatedSchedule
      };
    }
  
    /**
     * Generate standings based on match results
     */
    generateStandings() {
      // Initialize standings for each player
      const standings = {};
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
  
      // Process completed matches
      this.schedule.forEach(round => {
        round.matches.forEach(match => {
          if (match.completed) {
            if (this.matchType === 'singles') {
              // Update player 1 stats
              standings[match.player1].matches += 1;
              standings[match.player1].pointsFor += match.score1;
              standings[match.player1].pointsAgainst += match.score2;
              
              // Update player 2 stats
              standings[match.player2].matches += 1;
              standings[match.player2].pointsFor += match.score2;
              standings[match.player2].pointsAgainst += match.score1;
              
              // Determine winner
              if (match.score1 > match.score2) {
                standings[match.player1].wins += 1;
                standings[match.player2].losses += 1;
              } else {
                standings[match.player2].wins += 1;
                standings[match.player1].losses += 1;
              }
            } else {
              // For doubles, we need to parse the team names
              // This is a simplified version and may need adjustment for real doubles scoring
              const team1Players = match.player1.split(' & ');
              const team2Players = match.player2.split(' & ');
              
              team1Players.forEach(player => {
                if (standings[player]) {
                  standings[player].matches += 1;
                  standings[player].pointsFor += match.score1;
                  standings[player].pointsAgainst += match.score2;
                  
                  if (match.score1 > match.score2) {
                    standings[player].wins += 1;
                  } else {
                    standings[player].losses += 1;
                  }
                }
              });
              
              team2Players.forEach(player => {
                if (standings[player]) {
                  standings[player].matches += 1;
                  standings[player].pointsFor += match.score2;
                  standings[player].pointsAgainst += match.score1;
                  
                  if (match.score2 > match.score1) {
                    standings[player].wins += 1;
                  } else {
                    standings[player].losses += 1;
                  }
                }
              });
            }
          }
        });
      });
  
      // Calculate point differential
      Object.values(standings).forEach(player => {
        player.pointDiff = player.pointsFor - player.pointsAgainst;
      });
  
      // Convert to array and sort by wins, then point differential
      const standingsArray = Object.values(standings);
      standingsArray.sort((a, b) => {
        if (b.wins !== a.wins) {
          return b.wins - a.wins; // Sort by wins (descending)
        }
        return b.pointDiff - a.pointDiff; // Then by point differential (descending)
      });
  
      return standingsArray;
    }
  
    /**
     * Shuffle players array (Fisher-Yates algorithm)
     */
    shufflePlayers(players) {
      for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
      }
      return players;
    }
  }