/**
 * Round Robyn - Tournament Schedule Generator
 * Main application script
 */
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const setupSection = document.getElementById('setup-section');
  const matchesSection = document.getElementById('matches-section');
  const standingsSection = document.getElementById('standings-section');
  const settingsSection = document.getElementById('settings-section');
  
  const setupLink = document.getElementById('setup-link');
  const matchesLink = document.getElementById('matches-link');
  const standingsLink = document.getElementById('standings-link');
  const settingsLink = document.getElementById('settings-link');
  
  const playerNameInput = document.getElementById('player-name-input');
  const addPlayerBtn = document.getElementById('add-player-btn');
  const playerList = document.getElementById('player-list');
  const setupForm = document.getElementById('setup-form');
  const generateBtn = document.getElementById('generate-btn');
  const allRoundsContainer = document.getElementById('all-rounds-container');
  const standingsTableBody = document.getElementById('standings-table-body');
  const courtNamesContainer = document.getElementById('court-names-container');
  const playerNamesContainer = document.getElementById('player-names-container');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const resetBtn = document.getElementById('reset-btn');
  const confirmResetBtn = document.getElementById('confirm-reset-btn');
  
  const winningPointsSelect = document.getElementById('winning-points');
  const customPointsContainer = document.getElementById('custom-points-container');
  const customPointsInput = document.getElementById('custom-points');
  
  // Setup wizard elements
  const setupProgress = document.getElementById('setup-progress');
  const setupSteps = document.querySelectorAll('.setup-step');
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');
  const tournamentSummary = document.getElementById('tournament-summary');
  const matchTypeInfo = document.querySelector('.match-type-info');
  
  // Bootstrap modals
  const scoreModal = new bootstrap.Modal(document.getElementById('score-modal'));
  const resetModal = new bootstrap.Modal(document.getElementById('reset-modal'));
  
  // App State
  let tournament = null;
  let currentRound = 1;
  let players = [];
  let courts = [];
  let currentStep = 1;
  const totalSteps = 6;
  
  // Initialize the application
  function init() {
      loadFromLocalStorage();
      setupEventListeners();
      
      // Initialize the match type info
      updateMatchTypeInfo(document.getElementById('match-type').value);
      
      // If no tournament data exists, show setup section with wizard
      if (!tournament) {
          showSection(setupSection);
          updateNavActiveState(setupLink);
          goToStep(1); // Start at first step
      } else {
          // If tournament exists, show matches by default
          showSection(matchesSection);
          updateNavActiveState(matchesLink);
          renderMatches();
          renderStandings();
      }
  }
  
  // Load data from localStorage if available
  function loadFromLocalStorage() {
      const savedData = localStorage.getItem('roundRobyn');
      if (savedData) {
          const data = JSON.parse(savedData);
          tournament = data.tournament;
          currentRound = data.currentRound || 1;
          players = data.players || [];
          courts = data.courts || [];
          
          // Render players in setup form
          renderPlayerList();
          renderCourtList();
      }
  }
  
  // Save data to localStorage
  function saveToLocalStorage() {
      const data = {
          tournament: tournament,
          currentRound: currentRound,
          players: players,
          courts: courts
      };
      localStorage.setItem('roundRobyn', JSON.stringify(data));
  }
  
  // Set up event listeners
  function setupEventListeners() {
      // Navigation links
      setupLink.addEventListener('click', function(e) {
          e.preventDefault();
          showSection(setupSection);
          updateNavActiveState(this);
          goToStep(1); // Reset to first step when clicking on Setup in nav
      });
      
      matchesLink.addEventListener('click', function(e) {
          e.preventDefault();
          if (tournament) {
              showSection(matchesSection);
              updateNavActiveState(this);
              renderMatches();
          } else {
              alert('Please generate a tournament schedule first');
          }
      });
      
      standingsLink.addEventListener('click', function(e) {
          e.preventDefault();
          if (tournament) {
              showSection(standingsSection);
              updateNavActiveState(this);
              renderStandings();
          } else {
              alert('Please generate a tournament schedule first');
          }
      });
      
      settingsLink.addEventListener('click', function(e) {
          e.preventDefault();
          if (tournament) {
              showSection(settingsSection);
              updateNavActiveState(this);
              renderSettings();
          } else {
              alert('Please generate a tournament schedule first');
          }
      });
      
      // Player management
      addPlayerBtn.addEventListener('click', addPlayer);
      playerNameInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
              e.preventDefault();
              addPlayer();
          }
      });
      
      // Court management
      const addCourtBtn = document.getElementById('add-court-btn');
      const courtNameInput = document.getElementById('court-name-input');
      
      addCourtBtn.addEventListener('click', addCourt);
      courtNameInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
              e.preventDefault();
              addCourt();
          }
      });
      
      // Tournament generation
      setupForm.addEventListener('submit', function(e) {
          e.preventDefault();
          generateTournament();
      });
      
      // Setup wizard navigation
      nextButtons.forEach(btn => {
          btn.addEventListener('click', function() {
              // Validate current step
              if (!validateStep(currentStep)) {
                  return;
              }
              
              // Update summary if going to last step
              if (currentStep === totalSteps - 1) {
                  updateTournamentSummary();
              }
              
              goToStep(currentStep + 1);
          });
      });
      
      prevButtons.forEach(btn => {
          btn.addEventListener('click', function() {
              goToStep(currentStep - 1);
          });
      });
      
      // Match type selection change
      document.getElementById('match-type').addEventListener('change', function() {
          updateMatchTypeInfo(this.value);
      });
      
      // We've removed round navigation buttons since we show all rounds
      
      // Settings
      saveSettingsBtn.addEventListener('click', saveSettings);
      
      // Reset functionality
      resetBtn.addEventListener('click', function() {
          resetModal.show();
      });
      
      confirmResetBtn.addEventListener('click', resetTournament);
      
      // Winning points selection
      winningPointsSelect.addEventListener('change', function() {
          if (this.value === 'custom') {
              customPointsContainer.style.display = 'block';
          } else {
              customPointsContainer.style.display = 'none';
          }
      });

      // Custom points validation
      customPointsInput.addEventListener('input', function() {
          const value = parseInt(this.value);
          if (isNaN(value) || value < 3) {
              this.setCustomValidity('Please enter a valid number (minimum 3)');
          } else {
              this.setCustomValidity('');
          }
      });
  }
  
  // Show one section and hide others
  function showSection(section) {
      setupSection.style.display = 'none';
      matchesSection.style.display = 'none';
      standingsSection.style.display = 'none';
      settingsSection.style.display = 'none';
      
      section.style.display = 'block';
  }
  
  // Update active state in navigation
  function updateNavActiveState(activeLink) {
      setupLink.classList.remove('active');
      matchesLink.classList.remove('active');
      standingsLink.classList.remove('active');
      settingsLink.classList.remove('active');
      
      activeLink.classList.add('active');
  }
  
  // Add a player to the list
  function addPlayer() {
      const name = playerNameInput.value.trim();
      if (name) {
          if (!players.includes(name)) {
              players.push(name);
              playerNameInput.value = '';
              renderPlayerList();
          } else {
              alert('This player is already in the list');
          }
      }
  }
  
  // Render the player list in setup form
  function renderPlayerList() {
      playerList.innerHTML = '';
      
      players.forEach((player, index) => {
          const li = document.createElement('li');
          li.className = 'list-group-item player-list-item';
          
          const playerName = document.createElement('span');
          playerName.textContent = player;
          
          const removeBtn = document.createElement('button');
          removeBtn.className = 'btn btn-sm btn-outline-danger';
          removeBtn.innerHTML = '<i class="fas fa-times"></i>';
          removeBtn.addEventListener('click', () => removePlayer(index));
          
          li.appendChild(playerName);
          li.appendChild(removeBtn);
          playerList.appendChild(li);
      });
  }
  
  // Remove a player from the list
  function removePlayer(index) {
      players.splice(index, 1);
      renderPlayerList();
  }
  
  // Add a court to the list
  function addCourt() {
      const courtNameInput = document.getElementById('court-name-input');
      const name = courtNameInput.value.trim();
      if (name) {
          if (!courts.includes(name)) {
              courts.push(name);
              courtNameInput.value = '';
              renderCourtList();
              saveToLocalStorage();
          } else {
              alert('This court name is already in the list');
          }
      }
  }
  
  // Render the court list in setup form
  function renderCourtList() {
      const courtList = document.getElementById('court-list');
      courtList.innerHTML = '';
      
      courts.forEach((court, index) => {
          const li = document.createElement('li');
          li.className = 'list-group-item court-list-item';
          
          const courtName = document.createElement('span');
          courtName.textContent = court;
          
          const removeBtn = document.createElement('button');
          removeBtn.className = 'btn btn-sm btn-outline-danger';
          removeBtn.innerHTML = '<i class="fas fa-times"></i>';
          removeBtn.addEventListener('click', () => removeCourt(index));
          
          li.appendChild(courtName);
          li.appendChild(removeBtn);
          courtList.appendChild(li);
      });
  }
  
  // Remove a court from the list
  function removeCourt(index) {
      courts.splice(index, 1);
      renderCourtList();
      saveToLocalStorage();
  }
  
  // Generate tournament schedule
  function generateTournament() {
      const numPlayers = players.length;
      
      // Validate player count
      if (numPlayers < 2) {
          alert('Please enter at least 2 players');
          return;
      }
      
      const matchType = document.getElementById('match-type').value;
      
      // Validate player count for fixed doubles
      if (matchType === 'fixed-doubles' && numPlayers % 2 !== 0) {
          alert('Fixed doubles requires an even number of players');
          return;
      }
      
      // Get court names from global courts array
      const courtNames = Array.isArray(courts) ? courts.slice() : [];
      const courtCount = courtNames.length;
      if (courtCount < 1) {
          alert('Please enter at least 1 court');
          return;
      }
      
      // Get winning points
      let winningPoints;
      if (winningPointsSelect.value === 'custom') {
          winningPoints = parseInt(customPointsInput.value);
          if (isNaN(winningPoints) || winningPoints < 3) {
              alert('Please enter a valid winning points value (minimum 3)');
              return;
          }
      } else {
          winningPoints = parseInt(winningPointsSelect.value);
      }
      
      // Create tournament scheduler
      const scheduler = new TournamentScheduler({
          players: players,
          courts: courtCount,
          courtNames: courtNames,
          matchType: matchType,
          winningPoints: winningPoints
      });
      
      console.log(`Creating tournament with ${courtCount} courts`);
      
      // Generate schedule
      try {
          tournament = scheduler.generateSchedule();
          
          tournament.courts = courtCount;
          tournament.courtNames = courtNames;
          
          currentRound = 1;
          
          // Save to localStorage
          saveToLocalStorage();
          
          // Show matches section
          showSection(matchesSection);
          updateNavActiveState(matchesLink);
          renderMatches();
          
          // Update UI to reflect tournament is created
          matchesLink.classList.remove('disabled');
          standingsLink.classList.remove('disabled');
          settingsLink.classList.remove('disabled');
      } catch (error) {
          alert('Error generating tournament: ' + error.message);
      }
  }
  
  // Render all matches for the tournament
  function renderMatches() {
      if (!tournament || !tournament.schedule) return;
      
      // Clear the container
      allRoundsContainer.innerHTML = '';
      
      // Debug output
      console.log("Tournament details:", {
          courts: tournament.courts,
          courtNames: tournament.courtNames,
          players: tournament.players.length,
          matchType: tournament.matchType,
          rounds: tournament.schedule.length
      });
      
      // Loop through all rounds
      tournament.schedule.forEach((roundData, roundIndex) => {
          // Create a round section
          const roundSection = document.createElement('div');
          roundSection.className = 'round-section mb-4';
          
          // Round header
          const roundHeader = document.createElement('h4');
          roundHeader.className = 'round-header mb-3';
          roundHeader.textContent = `Round ${roundIndex + 1}`;
          roundSection.appendChild(roundHeader);
          
          // Create row for courts in this round
          const roundRow = document.createElement('div');
          roundRow.className = 'row';
          
          // Group matches by court
          const matchesByCourtMap = new Map();
          
          console.log(`Round ${roundIndex+1} has ${roundData.matches.length} matches`);
          
          roundData.matches.forEach(match => {
              console.log(`Match ${match.id}: Court ${match.court} (${match.courtName}) - ${match.player1} vs ${match.player2}`);
              const courtIndex = match.court - 1;
              if (!matchesByCourtMap.has(courtIndex)) {
                  matchesByCourtMap.set(courtIndex, []);
              }
              matchesByCourtMap.get(courtIndex).push(match);
          });
          
          // Sort courts by number
          const sortedCourtIndices = Array.from(matchesByCourtMap.keys()).sort((a, b) => a - b);
          console.log(`Courts being displayed for round ${roundIndex+1}:`, sortedCourtIndices.map(i => i+1));
          
          // Create court columns
          sortedCourtIndices.forEach(courtIndex => {
              const courtMatches = matchesByCourtMap.get(courtIndex);
              const courtName = tournament.courtNames[courtIndex];
              
              // Create court column
              const courtCol = document.createElement('div');
              courtCol.className = 'col-md-6 col-lg-4 mb-4';
              
              // Create court card
              const courtCard = document.createElement('div');
              courtCard.className = 'card h-100';
              
              // Court header
              const courtHeader = document.createElement('div');
              courtHeader.className = 'card-header';
              courtHeader.textContent = courtName;
              
              // Court body
              const courtBody = document.createElement('div');
              courtBody.className = 'card-body';
              
              // Add matches to court
              courtMatches.forEach(match => {
                  // Create match container
                  const matchDiv = document.createElement('div');
                  matchDiv.className = 'match-container';
                  matchDiv.dataset.round = roundIndex;
                  matchDiv.dataset.matchId = match.id;
                  
                  // Create match card
                  const matchCard = document.createElement('div');
                  matchCard.className = 'card match-card';
                  
                  // Match card body
                  const matchCardBody = document.createElement('div');
                  matchCardBody.className = 'card-body p-3';
                  
                  // Match type indicator
                  const matchTypeDiv = document.createElement('div');
                  matchTypeDiv.className = 'small text-muted mb-2';
                  matchTypeDiv.textContent = tournament.matchType === 'singles' ? 'Singles Match' : 'Doubles Match';
                  
                  // Player 1
                  const player1Div = document.createElement('div');
                  player1Div.className = 'match-player';
                  
                  const player1Name = document.createElement('span');
                  player1Name.textContent = match.player1;
                  
                  const player1Score = document.createElement('span');
                  if (match.completed) {
                      player1Score.className = 'badge bg-primary score-badge';
                      player1Score.textContent = match.score1;
                  } else {
                      player1Score.className = 'badge bg-secondary score-badge';
                      player1Score.textContent = '-';
                  }
                  
                  player1Div.appendChild(player1Name);
                  player1Div.appendChild(player1Score);
                  
                  // VS divider
                  const vsDiv = document.createElement('div');
                  vsDiv.className = 'match-divider';
                  vsDiv.innerHTML = '<i class="fas fa-bolt"></i> vs <i class="fas fa-bolt"></i>';
                  
                  // Player 2
                  const player2Div = document.createElement('div');
                  player2Div.className = 'match-player';
                  
                  const player2Name = document.createElement('span');
                  player2Name.textContent = match.player2;
                  
                  const player2Score = document.createElement('span');
                  if (match.completed) {
                      player2Score.className = 'badge bg-primary score-badge';
                      player2Score.textContent = match.score2;
                  } else {
                      player2Score.className = 'badge bg-secondary score-badge';
                      player2Score.textContent = '-';
                  }
                  
                  player2Div.appendChild(player2Name);
                  player2Div.appendChild(player2Score);
                  
                  // Enter score button
                  const scoreBtn = document.createElement('button');
                  scoreBtn.className = 'btn btn-sm btn-outline-primary w-100 mt-3';
                  scoreBtn.innerHTML = match.completed ? 
                      '<i class="fas fa-edit"></i> Edit Score' : 
                      '<i class="fas fa-plus"></i> Enter Score';
                  
                  scoreBtn.addEventListener('click', () => openScoreModal(match, roundIndex));
                  
                  // Assemble match card
                  matchCardBody.appendChild(matchTypeDiv);
                  matchCardBody.appendChild(player1Div);
                  matchCardBody.appendChild(vsDiv);
                  matchCardBody.appendChild(player2Div);
                  matchCardBody.appendChild(scoreBtn);
                  
                  matchCard.appendChild(matchCardBody);
                  matchDiv.appendChild(matchCard);
                  courtBody.appendChild(matchDiv);
              });
              
              // Assemble court card
              courtCard.appendChild(courtHeader);
              courtCard.appendChild(courtBody);
              courtCol.appendChild(courtCard);
              roundRow.appendChild(courtCol);
          });
          
          roundSection.appendChild(roundRow);
          allRoundsContainer.appendChild(roundSection);
      });
  }
  
  // Navigate between rounds - no longer needed but kept for reference
  function navigateRound(change) {
      // This function is no longer used as we display all rounds
  }
  
  // Navigate to a specific step in the setup wizard
  function goToStep(stepNumber) {
      // Ensure step is within bounds
      if (stepNumber < 1 || stepNumber > totalSteps) return;
      
      // Hide all steps
      setupSteps.forEach(step => {
          step.style.display = 'none';
      });
      
      // Show the requested step
      document.getElementById(`step-${stepNumber}`).style.display = 'block';
      
      // Update progress bar
      const progress = ((stepNumber - 1) / (totalSteps - 1)) * 100;
      setupProgress.style.width = `${progress}%`;
      setupProgress.textContent = `Step ${stepNumber} of ${totalSteps}`;
      setupProgress.setAttribute('aria-valuenow', progress);
      
      // Update current step
      currentStep = stepNumber;
  }
  
  // Validate the current step before proceeding
  function validateStep(step) {
      switch(step) {
          case 2: // Player Names step
              if (players.length < 2) {
                  alert('Please add at least 2 players');
                  return false;
              }
              return true;
              
          case 3: // Courts step
              if (courts.length < 1) {
                  alert('Please enter at least 1 court');
                  return false;
              }
              return true;
              
          case 4: // Match Type step
              const matchType = document.getElementById('match-type').value;
              if (matchType === 'fixed-doubles' && players.length % 2 !== 0) {
                  alert('Fixed doubles requires an even number of players. Please go back and add or remove players.');
                  return false;
              }
              return true;
              
          case 5: // Winning Points step
              const winningPointsValue = winningPointsSelect.value;
              if (winningPointsValue === 'custom') {
                  const customPoints = parseInt(customPointsInput.value);
                  if (isNaN(customPoints) || customPoints < 3) {
                      alert('Please enter a valid number of points (minimum 3)');
                      return false;
                  }
              }
              return true;
              
          default:
              return true;
      }
  }
  
  // Update match type information
  function updateMatchTypeInfo(matchType) {
      switch(matchType) {
          case 'singles':
              matchTypeInfo.innerHTML = '<strong>Singles:</strong> One player vs one player.';
              break;
          case 'fixed-doubles':
              matchTypeInfo.innerHTML = '<strong>Fixed Doubles:</strong> Players are paired up for the entire tournament. <span class="text-warning">Requires an even number of players.</span>';
              break;
          case 'random-doubles':
              matchTypeInfo.innerHTML = '<strong>Random Doubles:</strong> Players are randomly paired for each round.';
              break;
      }
  }
  
  // Update tournament summary before generating
  function updateTournamentSummary() {
      const matchType = document.getElementById('match-type').value;
      const courts = parseInt(document.getElementById('courts').value);
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
                  <span class="badge bg-primary rounded-pill">${courts}</span>
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
  
  // Open score modal for a match
  function openScoreModal(match, roundIndex) {
      const scoreMatchId = document.getElementById('score-match-id');
      const scoreRound = document.getElementById('score-round');
      const scoreCourt = document.getElementById('score-court');
      const scorePlayer1 = document.getElementById('score-player1');
      const scorePlayer2 = document.getElementById('score-player2');
      const scorePlayer1Score = document.getElementById('score-player1-score');
      const scorePlayer2Score = document.getElementById('score-player2-score');
      const loserScore = document.getElementById('loser-score');
      const scoreEntryContainer = document.getElementById('score-entry-container');
      const saveScoreBtn = document.getElementById('save-score-btn');
      const winnerPlayer1 = document.getElementById('winner-player1');
      const winnerPlayer2 = document.getElementById('winner-player2');
      
      // Selected winner
      let selectedWinner = null;

      // Reset score entry container
      scoreEntryContainer.style.display = 'none';
      loserScore.value = '';
      
      // Reset winner buttons
      winnerPlayer1.classList.remove('btn-success');
      winnerPlayer1.classList.add('btn-outline-success');
      winnerPlayer2.classList.remove('btn-success');
      winnerPlayer2.classList.add('btn-outline-success');
      
      // Set modal values
      scoreMatchId.value = match.id;
      scoreRound.value = roundIndex;
      scoreCourt.value = match.court - 1;
      scorePlayer1.textContent = match.player1;
      scorePlayer2.textContent = match.player2;
      
      // Pre-select winner if match is completed
      if (match.completed) {
          if (match.score1 > match.score2) {
              // Player 1 was the winner
              winnerPlayer1.classList.remove('btn-outline-success');
              winnerPlayer1.classList.add('btn-success');
              selectedWinner = 1;
              loserScore.value = match.score2;
          } else {
              // Player 2 was the winner
              winnerPlayer2.classList.remove('btn-outline-success');
              winnerPlayer2.classList.add('btn-success');
              selectedWinner = 2;
              loserScore.value = match.score1;
          }
          scoreEntryContainer.style.display = 'block';
      }
      
      // Set up winner selection
      winnerPlayer1.onclick = function() {
          // Mark player 1 as winner
          winnerPlayer1.classList.remove('btn-outline-success');
          winnerPlayer1.classList.add('btn-success');
          
          // Reset player 2 styling
          winnerPlayer2.classList.remove('btn-success');
          winnerPlayer2.classList.add('btn-outline-success');
          
          selectedWinner = 1;
          scoreEntryContainer.style.display = 'block';
      };
      
      winnerPlayer2.onclick = function() {
          // Mark player 2 as winner
          winnerPlayer2.classList.remove('btn-outline-success');
          winnerPlayer2.classList.add('btn-success');
          
          // Reset player 1 styling
          winnerPlayer1.classList.remove('btn-success');
          winnerPlayer1.classList.add('btn-outline-success');
          
          selectedWinner = 2;
          scoreEntryContainer.style.display = 'block';
      };
      
      // Set up save button handler
      saveScoreBtn.onclick = function() {
          // Validate input
          if (!selectedWinner) {
              alert('Please select a winner first');
              return;
          }
          
          const loserScoreValue = parseInt(loserScore.value);
          if (isNaN(loserScoreValue) || loserScoreValue < 0) {
              alert('Please enter a valid score for the loser');
              return;
          }
          
          let player1Score, player2Score;
          
          // Set scores based on winner
          if (selectedWinner === 1) {
              // Player 1 won
              player1Score = tournament.winningPoints;
              player2Score = loserScoreValue;
          } else {
              // Player 2 won
              player1Score = loserScoreValue;
              player2Score = tournament.winningPoints;
          }
          
          // Find match in tournament data
          const round = tournament.schedule[roundIndex];
          const matchIndex = round.matches.findIndex(m => m.id === match.id);
          
          if (matchIndex !== -1) {
              // Update match score
              tournament.schedule[roundIndex].matches[matchIndex].score1 = player1Score;
              tournament.schedule[roundIndex].matches[matchIndex].score2 = player2Score;
              tournament.schedule[roundIndex].matches[matchIndex].completed = true;
              
              // Save to localStorage
              saveToLocalStorage();
              
              // Re-render matches
              renderMatches();
              renderStandings();
              
              // Close modal
              scoreModal.hide();
          }
      };
      
      // Show modal
      scoreModal.show();
  }
  
  // Render standings table
  function renderStandings() {
      if (!tournament) return;
      
      // Create scheduler instance to calculate standings
      const scheduler = new TournamentScheduler({
          players: tournament.players,
          courts: tournament.courts,
          matchType: tournament.matchType,
          winningPoints: tournament.winningPoints
      });
      
      // Copy schedule to scheduler
      scheduler.schedule = tournament.schedule;
      
      // Generate standings
      const standings = scheduler.generateStandings();
      
      // Clear standings table
      standingsTableBody.innerHTML = '';
      
      // Render standings rows
      standings.forEach((player, index) => {
          const row = document.createElement('tr');
          
          // Rank
          const rankCell = document.createElement('td');
          rankCell.textContent = index + 1;
          
          // Player name
          const nameCell = document.createElement('td');
          nameCell.textContent = player.name;
          
          // Matches
          const matchesCell = document.createElement('td');
          matchesCell.textContent = player.matches;
          
          // Wins
          const winsCell = document.createElement('td');
          winsCell.textContent = player.wins;
          
          // Losses
          const lossesCell = document.createElement('td');
          lossesCell.textContent = player.losses;
          
          // Points For
          const pointsForCell = document.createElement('td');
          pointsForCell.textContent = player.pointsFor;
          
          // Points Against
          const pointsAgainstCell = document.createElement('td');
          pointsAgainstCell.textContent = player.pointsAgainst;
          
          // Point Diff
          const pointDiffCell = document.createElement('td');
          pointDiffCell.textContent = player.pointDiff;
          
          // Add cells to row
          row.appendChild(rankCell);
          row.appendChild(nameCell);
          row.appendChild(matchesCell);
          row.appendChild(winsCell);
          row.appendChild(lossesCell);
          row.appendChild(pointsForCell);
          row.appendChild(pointsAgainstCell);
          row.appendChild(pointDiffCell);
          
          // Add row to table
          standingsTableBody.appendChild(row);
      });
  }
  
  // Render settings form
  function renderSettings() {
      if (!tournament) return;
      
      // Render court names form
      courtNamesContainer.innerHTML = '';
      tournament.courtNames.forEach((name, index) => {
          const formGroup = document.createElement('div');
          formGroup.className = 'mb-3 row align-items-center';
          
          const label = document.createElement('label');
          label.className = 'col-sm-3 col-form-label';
          label.textContent = `Court ${index + 1}`;
          
          const inputDiv = document.createElement('div');
          inputDiv.className = 'col-sm-9';
          
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'form-control court-name-input';
          input.value = name;
          input.dataset.index = index;
          
          inputDiv.appendChild(input);
          formGroup.appendChild(label);
          formGroup.appendChild(inputDiv);
          courtNamesContainer.appendChild(formGroup);
      });
      
      // Render player names form
      playerNamesContainer.innerHTML = '';
      tournament.players.forEach((name, index) => {
          const formGroup = document.createElement('div');
          formGroup.className = 'mb-3 row align-items-center';
          
          const label = document.createElement('label');
          label.className = 'col-sm-3 col-form-label';
          label.textContent = `Player ${index + 1}`;
          
          const inputDiv = document.createElement('div');
          inputDiv.className = 'col-sm-9';
          
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'form-control player-name-input';
          input.value = name;
          input.dataset.index = index;
          input.dataset.original = name;
          
          inputDiv.appendChild(input);
          formGroup.appendChild(label);
          formGroup.appendChild(inputDiv);
          playerNamesContainer.appendChild(formGroup);
      });
  }
  
  // Save settings
  function saveSettings() {
      if (!tournament) return;
      
      // Get updated court names
      const courtNameInputs = document.querySelectorAll('.court-name-input');
      const updatedCourtNames = Array.from(courtNameInputs).map(input => input.value.trim());
      
      // Get updated player names
      const playerNameInputs = document.querySelectorAll('.player-name-input');
      const playerNameMapping = {};
      const updatedPlayers = [];
      
      playerNameInputs.forEach(input => {
          const originalName = input.dataset.original;
          const newName = input.value.trim();
          
          if (originalName !== newName) {
              playerNameMapping[originalName] = newName;
          }
          
          updatedPlayers.push(newName);
      });
      
      // Create scheduler instance to update names
      const scheduler = new TournamentScheduler({
          players: tournament.players,
          courts: tournament.courts,
          matchType: tournament.matchType,
          winningPoints: tournament.winningPoints
      });
      
      // Copy schedule to scheduler
      scheduler.schedule = tournament.schedule;
      
      // Update court names
      scheduler.courtNames = updatedCourtNames;
      scheduler.updateCourtNames(updatedCourtNames);
      
      // Update player names if there are changes
      if (Object.keys(playerNameMapping).length > 0) {
          const result = scheduler.updatePlayerNames(playerNameMapping);
          tournament.players = result.players;
          tournament.schedule = result.schedule;
      }
      
      // Update tournament data
      tournament.courtNames = updatedCourtNames;
      tournament.players = updatedPlayers;
      
      // Save to localStorage
      players = updatedPlayers;
      saveToLocalStorage();
      
      // Update displays
      renderMatches();
      renderStandings();
      
      // Show success message
      alert('Settings saved successfully');
  }
  
  // Reset tournament
  function resetTournament() {
      // Clear tournament data
      tournament = null;
      currentRound = 1;
      players = [];
      courts = [];
      
      // Clear localStorage
      localStorage.removeItem('roundRobyn');
      
      // Reset UI
      renderPlayerList();
      renderCourtList();
      showSection(setupSection);
      updateNavActiveState(setupLink);
      
      // Hide modal
      resetModal.hide();
  }
  
  // Initialize the app
  init();
});
