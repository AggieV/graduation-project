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
    const cardOverlay = document.getElementById('card-overlay');
    const cardContent = document.getElementById('card-content');
    const cardCloseBtn = document.getElementById('card-close-btn');
    const startOverlay = document.getElementById('start-overlay'); // Nieuw element

    // --- Spel Status (Multiplayer) ---
    let players = [
        { id: 1, position: 1, name: "Technicus", skipCount: 0, isHuman: false },
        { id: 2, position: 1, name: "Controleur", skipCount: 0, isHuman: false },
        { id: 3, position: 1, name: "Verbinder", skipCount: 0, isHuman: false },
        { id: 4, position: 1, name: "Strateeg", skipCount: 0, isHuman: false }
    ];
    let currentPlayerIndex = 0;
    let isProcessingTurn = false; // Voorkomt dubbele klikken/beurten

    /**
     * Schakelt de knop in/uit, wat vastlopen voorkomt.
     */
    function setControlsActive(active, text = "Gooi de Dobbelsteen (1-3)") {
        const activePlayer = players[currentPlayerIndex];
        
        if (activePlayer.isHuman) {
             dobbelKnop.disabled = !active;
             dobbelKnop.textContent = text;
        } else {
             // Als het een AI is, blokkeer de knop altijd
             dobbelKnop.disabled = true;
             dobbelKnop.textContent = activePlayer.name + " is aan de beurt...";
        }
    }

    /**
     * Verplaatst de pion visueel en logisch.
     * @param {boolean} isActionMove - Waar als dit een automatische beweging is (Brug/Kaart).
     */
    function movePawn(playerId, targetPosition, isActionMove = false) {
        const player = players.find(p => p.id === playerId);
        if (!player) return;

        if (targetPosition < 1) targetPosition = 1;
        const finalPosition = Math.min(targetPosition, totalSpaces);

        // 1. Visuele update van de oude positie
        document.querySelectorAll('.vakje.highlighted').forEach(v => {
             if (v.id === `vakje-${player.position}`) { 
                 v.classList.remove('highlighted');
             }
        });
        
        // 2. Logische update
        player.position = finalPosition;
        
        // 3. Visuele update van de nieuwe positie (Pion en Vakje)
        const newVakje = document.getElementById(`vakje-${finalPosition}`);
        const pionContainer = document.getElementById(`pion-container-${playerId}`);
        
        if (newVakje && pionContainer) {
            newVakje.classList.add('highlighted');

            const rect = newVakje.getBoundingClientRect();
            const boardRect = document.getElementById('board').getBoundingClientRect();
            
            // Bereken de positie voor de container
            const pionX = rect.left + rect.width / 2 - pionContainer.offsetWidth / 2 - boardRect.left;
            const pionY = rect.top + rect.height / 2 - pionContainer.offsetHeight / 2 - boardRect.top;

            pionContainer.style.left = `${pionX}px`;
            pionContainer.style.top = `${pionY}px`;
        }
        
        // --- Speciale Vakjes Controle (Alleen na een ECHTE worp) ---
        if (!isActionMove) {
            
            if (finalPosition === totalSpaces) {
                isProcessingTurn = false;
                setControlsActive(false, "FINISH!");
                alert(`${player.name} heeft de Finish bereikt! Het spel is afgelopen!`);
                return; 
            }

            // Brug (vakje 6)
            if (finalPosition === 6) {
                setTimeout(() => {
                    alert(`Brug op vakje 6! ${player.name} gaat 2 stappen vooruit!`);
                    movePawn(playerId, player.position + 2, true); 
                    // Wissel direct van beurt na de actie
                    nextTurn(); 
                }, 1000); 
                return; 
            }

            // Kaart (vakjes 3 en 7)
            if (cardSpaces.includes(finalPosition)) {
                const randomIndex = Math.floor(Math.random() * challengeCards.length);
                showCard(player, challengeCards[randomIndex]);
                return; 
            }
            
            // Standaard: Ga door naar de volgende beurt (na een normale landing)
            nextTurn();
        }
    }

    /**
     * Toont de uitdagingskaart.
     */
    function showCard(player, cardText) {
        setControlsActive(false, "Wacht op Kaart...");
        
        cardContent.textContent = cardText;
        cardOverlay.style.display = 'flex'; 

        const closeCard = () => {
            cardOverlay.style.display = 'none';
            setControlsActive(true); 

            // Effecten toepassen
            if (cardText.includes("Ga 1 stap terug.")) {
                // True: dit is een actiebeweging
                movePawn(player.id, player.position - 1, true); 
            } else if (cardText.includes("Gooi nog een keer!")) {
                alert(`${player.name}, je mag nog een keer gooien!`);
                isProcessingTurn = false; // Beurt is nog niet klaar
                updateTurnDisplay(); 
                return; 
            } else if (cardText.includes("Sla 1 beurt over.")) {
                player.skipCount = 1; 
            } 
            
            // Wissel van beurt nadat de kaart is afgehandeld
            nextTurn();
        };

        // Als het een AI-kaart is, sluit de kaart automatisch
        if (!player.isHuman) {
            setTimeout(closeCard, 3000); // 3 seconden wachten
            cardCloseBtn.style.display = 'none';
        } else {
            // Anders moet de menselijke speler de knop bedienen
            cardCloseBtn.style.display = 'block';
            cardCloseBtn.onclick = closeCard;
        }
    }

    /**
     * Wisselt van beurt en start AI-beurt indien nodig.
     */
    function nextTurn() {
        isProcessingTurn = false; // Beurt is voltooid, klaar voor de volgende klik

        // 1. Wacht een moment voordat de beurt wisselt, om de animatie te laten zien
        setTimeout(() => {
            currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
            
            // 2. Sla over indien nodig
            if (players[currentPlayerIndex].skipCount > 0) {
                players[currentPlayerIndex].skipCount--;
                alert(`${players[currentPlayerIndex].name} slaat deze beurt over!`);
                nextTurn(); 
                return;
            }

            updateTurnDisplay();

            // 3. Start AI-beurt indien nodig
            if (!players[currentPlayerIndex].isHuman) {
                // Korte vertraging om de speler te laten zien wie aan de beurt is
                setTimeout(startAITurn, 1500); 
            }
        }, 500);
    }

    /**
     * Voert de beurt van de computer uit.
     */
    function startAITurn() {
        if (isProcessingTurn) return; // Dubbele beurt voorkomen
        isProcessingTurn = true;
        
        const activePlayer = players[currentPlayerIndex];
        const roll = Math.floor(Math.random() * 3) + 1;

        // Visuele weergave van de AI-worp
        dobbelResultaat.src = `images/dobbel-${roll}.png`;
        dobbelResultaat.alt = `AI Gegooid: ${roll}`;
        dobbelKnop.textContent = `${activePlayer.name}: Worp ${roll}!`;
        
        // Verplaats de pion na een korte vertraging
        setTimeout(() => {
            const newPosition = activePlayer.position + roll;
            movePawn(activePlayer.id, newPosition);
        }, 1000); 
    }

    /**
     * Werkt de beurt- en pionweergave bij.
     */
    function updateTurnDisplay() {
        document.querySelectorAll('.pion').forEach(p => p.classList.remove('active-player-pion'));
        
        const activePlayer = players[currentPlayerIndex];
        document.getElementById(`pion-${activePlayer.id}`).classList.add('active-player-pion');
        
        spelerNaamTekst.textContent = activePlayer.name;
        positieTekst.textContent = activePlayer.position;
        
        setControlsActive(true); // Zet de knop klaar voor de menselijke speler
    }


    // --- FUNCTIE: Start het spel na rolkeuze ---
    function startGame(selectedPlayerId) {
        // 1. Verberg de start overlay
        startOverlay.style.display = 'none';

        // 2. Markeer de gekozen speler als menselijk
        let initialIndex = 0;
        players.forEach((p, index) => {
            if (p.id === selectedPlayerId) {
                p.isHuman = true;
                initialIndex = index;
            }
        });
        
        // 3. Start het spel bij de gekozen speler
        currentPlayerIndex = initialIndex;

        // 4. Initialiseer pionnen op hun startpositie (geen acties triggeren)
        players.forEach(player => movePawn(player.id, player.position, true)); 
        updateTurnDisplay();
        
        dobbelResultaat.src = "images/dobbel-init.png";
    }


    // --- EVENT LISTENERS ---

    // 1. Rolkaart Klik (Start Game)
    document.querySelectorAll('.role-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const roleId = e.currentTarget.dataset.roleId; 
            if (roleId) {
                startGame(parseInt(roleId));
            }
        });
    });

    // 2. Dobbelknop Klik (Alleen voor de Menselijke Speler)
    dobbelKnop.addEventListener('click', () => {
        const activePlayer = players[currentPlayerIndex];
        
        // Check of het een menselijke beurt is EN er geen beurt bezig is
        if (!activePlayer.isHuman || isProcessingTurn || dobbelKnop.disabled) return; 
        
        isProcessingTurn = true;

        const roll = Math.floor(Math.random() * 3) + 1;
        
        dobbelResultaat.src = `images/dobbel-${roll}.png`;
        dobbelResultaat.alt = `Gegooid: ${roll}`;

        setControlsActive(false, `Worp: ${roll}!`);

        setTimeout(() => {
            const newPosition = activePlayer.position + roll;
            movePawn(activePlayer.id, newPosition);
            
            if (activePlayer.position === totalSpaces) {
                 setControlsActive(false, `Finish!`);
            }
        }, 500); 
    });
});