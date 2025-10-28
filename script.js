document.addEventListener('DOMContentLoaded', () => {
    // --- Spel Configuratie ---
    const totalSpaces = 10;
    const cardSpaces = [3, 7]; 
    
    const challengeCards = [
        "Uitdaging: Je hebt vertraging bij de implementatie. Ga 1 stap terug.",
        "Succes: Je team heeft een efficiëntie-doorbraak. Gooi nog een keer!",
        "Vraag: Noem één van de 9 soorten innovatie (Product, Proces, etc.). Antwoord fout? Sla 1 beurt over."
    ];

    // --- HTML Elementen ---
    const dobbelKnop = document.getElementById('dobbel-btn');
    const dobbelResultaat = document.getElementById('dobbel-resultaat');
    const positieTekst = document.getElementById('current-position');
    const spelerNaamTekst = document.getElementById('current-player-name');
    const board = document.getElementById('board');
    const cardOverlay = document.getElementById('card-overlay');
    const cardContent = document.getElementById('card-content');
    const cardCloseBtn = document.getElementById('card-close-btn');

    // --- Spel Status (Multiplayer) ---
    // VIER SPELERS met unieke namen
    let players = [
        { id: 1, position: 1, name: "Technicus", skipNextTurn: false, skipCount: 0 },
        { id: 2, position: 1, name: "Controleur", skipNextTurn: false, skipCount: 0 },
        { id: 3, position: 1, name: "Verbinder", skipNextTurn: false, skipCount: 0 },
        { id: 4, position: 1, name: "Strateeg", skipNextTurn: false, skipCount: 0 }
    ];
    let currentPlayerIndex = 0;
    let cardActive = false; 

    // --- FUNCTIES VOOR DE SPEL-LOGICA ---

    /**
     * Verplaatst de pion visueel en logisch naar de doelpositie.
     */
    function movePawn(playerId, targetPosition, isInitialDraw = false) {
        const player = players.find(p => p.id === playerId);
        if (!player) return;

        // Blijf binnen de grenzen van het bord
        if (targetPosition < 1) targetPosition = 1;
        const finalPosition = Math.min(targetPosition, totalSpaces);

        // Verwijder de 'highlighted' klasse van de oude positie
        if (!isInitialDraw) {
             document.querySelectorAll('.vakje.highlighted').forEach(v => {
                if(v.id === `vakje-${player.position}`) { 
                    v.classList.remove('highlighted');
                }
            });
        }
        
        // Update de positie in de spelersarray
        player.position = finalPosition;
        
        // Highlight het nieuwe vakje en verplaats de pion container
        const newVakje = document.getElementById(`vakje-${finalPosition}`);
        const pionContainer = document.getElementById(`pion-container-${playerId}`);
        
        if (newVakje && pionContainer) {
            newVakje.classList.add('highlighted');

            // Bepaal de nieuwe positie van de pion container
            const rect = newVakje.getBoundingClientRect();
            const boardRect = document.getElementById('board').getBoundingClientRect();
            
            const pionX = rect.left + rect.width / 2 - pionContainer.offsetWidth / 2 - boardRect.left;
            const pionY = rect.top + rect.height / 2 - pionContainer.offsetHeight / 2 - boardRect.top;

            pionContainer.style.left = `${pionX}px`;
            pionContainer.style.top = `${pionY}px`;
        }

        // --- Controleer op speciale vakjes ---
        if (finalPosition === totalSpaces) {
            dobbelKnop.disabled = true;
            dobbelKnop.textContent = "FINISH!";
            alert(`${player.name} heeft de Finish bereikt! Het spel is afgelopen!`);
            return; 
        }

        // Controleer op Brug (vakje 6)
        if (finalPosition === 6 && !isInitialDraw) {
            setTimeout(() => {
                alert(`Brug op vakje 6! ${player.name} gaat 2 stappen vooruit!`);
                movePawn(playerId, player.position + 2);
            }, 600);
            return; 
        }

        // Controleer op Kaart (vakjes 3 en 7)
        if (cardSpaces.includes(finalPosition) && !isInitialDraw) {
            const randomIndex = Math.floor(Math.random() * challengeCards.length);
            showCard(player, challengeCards[randomIndex]);
            return; 
        }
        
        // Als alles klaar is, wissel van beurt
        if (!isInitialDraw && !cardActive) {
            nextTurn();
        }
    }

    /**
     * Toont de uitdagingskaart.
     */
    function showCard(player, cardText) {
        cardActive = true;
        cardContent.textContent = cardText;
        cardOverlay.style.display = 'flex'; 
        dobbelKnop.disabled = true;
        dobbelKnop.textContent = "Wacht op Kaart...";

        const closeCard = () => {
            cardOverlay.style.display = 'none';
            dobbelKnop.disabled = false;
            cardActive = false;
            dobbelKnop.textContent = "Gooi de Dobbelsteen (1-3)";

            // Effecten toepassen
            if (cardText.includes("Ga 1 stap terug.")) {
                movePawn(player.id, player.position - 1); 
            } else if (cardText.includes("Gooi nog een keer!")) {
                alert(`${player.name}, je mag nog een keer gooien!`);
                updateTurnDisplay(); 
                return; 
            } else if (cardText.includes("Sla 1 beurt over.")) {
                player.skipCount = 1; 
                nextTurn(); 
                return;
            } 
            
            // Standaard: Ga door naar de volgende speler
            nextTurn();
        };

        cardCloseBtn.onclick = closeCard;
    }

    /**
     * Wisselt van beurt.
     */
    function nextTurn() {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        
        // Controleer op overgeslagen beurten
        if (players[currentPlayerIndex].skipCount > 0) {
            players[currentPlayerIndex].skipCount--;
            alert(`${players[currentPlayerIndex].name} slaat deze beurt over!`);
            nextTurn(); 
            return;
        }

        updateTurnDisplay();
    }

    /**
     * Werkt de beurt- en pionweergave bij.
     */
    function updateTurnDisplay() {
        // Verwijder 'active-player-pion' van alle pionnen
        document.querySelectorAll('.pion').forEach(p => p.classList.remove('active-player-pion'));
        
        const activePlayer = players[currentPlayerIndex];
        
        // Voeg 'active-player-pion' toe aan de actieve speler
        document.getElementById(`pion-${activePlayer.id}`).classList.add('active-player-pion');
        
        spelerNaamTekst.textContent = activePlayer.name;
        positieTekst.textContent = activePlayer.position;
        
        // Reset de knop en dobbelsteenafbeelding
        dobbelKnop.textContent = "Gooi de Dobbelsteen (1-3)";
        dobbelKnop.disabled = false;
    }


    // --- EVENT LISTENERS ---

    dobbelKnop.addEventListener('click', () => {
        if (cardActive || dobbelKnop.disabled) return; 
        
        const activePlayer = players[currentPlayerIndex];
        const roll = Math.floor(Math.random() * 3) + 1; // Worp is 1, 2 of 3
        
        // 1. Toon het resultaat met de AFBEELDING
        dobbelResultaat.src = `images/dobbel-${roll}.png`;
        dobbelResultaat.alt = `Gegooid: ${roll}`;

        // 2. Schakel de knop uit en toon de worptekst
        dobbelKnop.textContent = `Worp: ${roll}!`;
        dobbelKnop.disabled = true;

        // 3. Verplaats de pion na een korte vertraging (0.5 seconde)
        setTimeout(() => {
            const newPosition = activePlayer.position + roll;
            movePawn(activePlayer.id, newPosition);
            
            if (activePlayer.position === totalSpaces) {
                 dobbelKnop.textContent = `Finish!`;
            }
        }, 500); 
    });


    // --- INITIALISATIE ---
    // Plaats alle 4 pionnen op vakje 1 en start de beurt
    players.forEach(player => movePawn(player.id, player.position, true));
    updateTurnDisplay();
    
    // Zorg ervoor dat de dobbelsteenafbeelding bij start geladen is
    dobbelResultaat.src = "images/dobbel-init.png"; 
});