document.addEventListener('DOMContentLoaded', () => {
    
    // --- SPEL CONFIGURATIE ---
    const totalSpaces = 7; 
    const spaceNames = {
        0: "START (Kies Focus)",
        1: "Analyse (JTBD)",
        2: "Validatie & Risico",
        3: "MVP Oplevering",
        4: "Pivot Check",
        5: "Marktstrategie",
        6: "Implementatie",
        7: "Evaluatie (FINISH)"
    };
    const moveDelay = 1000; 
    
    // --- HTML ELEMENTEN ---
    const startOverlay = document.getElementById('start-overlay');
    const startProjectBtn = document.getElementById('start-project-btn');
    const horizonBtns = document.querySelectorAll('.horizon-btn');
    const selectedHorizonInfo = document.getElementById('selected-horizon-info');
        
    // Taak Overlay Elementen (NU UNIEK GEDECLAREERD)
    const taskOverlay = document.getElementById('task-overlay');
    const taskContent = document.getElementById('task-content'); 
    const decisionOptionsDiv = document.getElementById('decision-options');
    
    // CHATBOT ELEMENTEN (UNIEK GEDECLAREERD)
    const chatbotOverlay = document.getElementById('chatbot-overlay');
    const openChatbotBtn = document.getElementById('open-chatbot-btn');
    const closeChatbotBtn = document.getElementById('close-chatbot-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');

    // De dobbelknop
    const diceBtn = document.getElementById('dice-btn'); 
    
    const currentPositionDisplay = document.getElementById('current-position-display');
    const board = document.getElementById('board'); 
    const pawnContainer = document.getElementById('pawn-container');
    
    
    // --- SPEL STATUS ---
    let project = {
        id: 1,
        position: 0, 
        name: "Nieuw Project",
        horizon: null
    };
    
    let isMoving = false; 

    // --- TAAK DEFINITIES ---
    const tasksPerSpace = {
        1: { opdracht: "Chatbot: Weet de klantbehoefte (JTBD) en de risicovolle aanname. Heeft het team de data via de chatbot ingevoerd? (Valkuil: Gebrek aan Duidelijke Doelen.)", opties: [{ label: "JA, Aanname Gedefinieerd", actie: 'complete', target: 2 }, { label: "NEE, Terug naar Veldwerk (Blijf)", actie: 'stay', target: 1 }] },
        2: { opdracht: "Chatbot: Is het Juridisch/Financieel Risico gecheckt EN hebben we genoeg bewijs na de MVP test? (Valkuil: Zwak Risicomanagement.)", opties: [{ label: "GO (Succesvol Bewijs)", actie: 'complete', target: 3 }, { label: "PIVOT (Aanpassen, Terug naar Vak 1)", actie: 'complete', target: 1 }, { label: "NO-GO (Stoppen/Archiveren)", actie: 'archive', target: 0 }] },
        3: { opdracht: "Chatbot: Is de MVP opgeleverd en getest door de eerste early adopters? (Valkuil: Technologische tunnelvisie.)", opties: [{ label: "JA, MVP Live", actie: 'complete', target: 4 }, { label: "NEE, Testfase afronden (Blijf)", actie: 'stay', target: 3 }] },
        4: { opdracht: "Chatbot: Zijn de marktfeedback en interne bevindingen positief genoeg om verder te gaan met opschaling? (Valkuil: 'Sunk Cost Fallacy'.)", opties: [{ label: "GO (Opschalen)", actie: 'complete', target: 5 }, { label: "PIVOT (Heroriëntatie)", actie: 'complete', target: 1 }, { label: "NO-GO (Stoppen/Archiveren)", actie: 'archive', target: 0 }] },
        5: { opdracht: "Chatbot: Is de volledige Go-to-Market Strategie (GTM) uitgewerkt en afgestemd met Sales/Marketing? (Valkuil: Gebrek aan Marktstrategie.)", opties: [{ label: "JA, GTM OK", actie: 'complete', target: 6 }, { label: "NEE, Plan Afmaken (Blijf)", actie: 'stay', target: 5 }] },
        6: { opdracht: "Chatbot: Is de uitrol begonnen en is het team volledig overgedragen aan de Operations afdeling? (Valkuil: Onvoldoende Stakeholder Betrokkenheid.)", opties: [{ label: "JA, Rollout Gestart", actie: 'complete', target: 7 }, { label: "NEE, Overdracht afronden (Blijf)", actie: 'stay', target: 6 }] },
        7: { opdracht: "Chatbot: Is het Eindverslag (met lessen) ingevuld in de SSoT én zijn de 2 meetpunten voor monitoring ingesteld? (Valkuil: Gebrek aan Leren en Feedback.)", opties: [{ label: "JA, Kennis Geborgd (FINISH)", actie: 'complete', target: 8 }, { label: "NEE, Documentatie is een must (Blijf)", actie: 'stay', target: 7 }] },
    };


    // --- KERN FUNCTIES ---

    function rollDice() {
        return Math.floor(Math.random() * 3) + 1; 
    }

    /**
     * Verplaatst de pion logisch en visueel.
     */
    function movePawn(targetPosition) {
        const oldPosition = project.position;
        const finalPosition = Math.min(targetPosition, totalSpaces);
        
        // Verwijder de highlight van de oude positie
        const oldSpace = document.getElementById(`space-${oldPosition}`);
        if (oldSpace) oldSpace.classList.remove('highlighted');
        
        project.position = finalPosition;
        
        if (project.position === totalSpaces) {
            handleFinish();
            return;
        }

        const newSpace = document.getElementById(`space-${project.position}`);

        if (newSpace && pawnContainer && board) { 
            
            window.requestAnimationFrame(() => {
                newSpace.classList.add('highlighted');
                
                // Gebruik offsetLeft/offsetTop om de positie t.o.v. het bord te berekenen
                const x = newSpace.offsetLeft; 
                const y = newSpace.offsetTop;

                pawnContainer.style.left = `${x}px`;
                pawnContainer.style.top = `${y}px`;
                
                updateDisplay();
            });
        }
    }
    
    function handleDiceRoll() {
        // Dubbele check: als er een taak open staat, mag je niet dobbelen
        if (isMoving || !project.horizon || taskOverlay.classList.contains('active')) {
             if (taskOverlay.classList.contains('active')) {
                 alert(`Voltooi eerst de opdracht op Vak ${project.position} voordat je verder dobbelt.`);
             } else if (!project.horizon) {
                 alert("Kies eerst een strategische focus.");
             }
             return;
        }
        
        isMoving = true;
        if (diceBtn) diceBtn.disabled = true;

        const diceRoll = rollDice();
        let newPosition = project.position + diceRoll;
        
        if (newPosition >= totalSpaces) {
             newPosition = totalSpaces; 
             currentPositionDisplay.textContent = `Je dobbelt ${diceRoll}! Naar FINISH!`;
        } else {
             currentPositionDisplay.textContent = `Je dobbelt ${diceRoll}! Naar Vak ${newPosition}.`;
        }


        setTimeout(() => {
            movePawn(newPosition);
            isMoving = false;
            
            if (project.position > 0 && project.position < totalSpaces) {
                // Toon de taak als we op een vak landen
                setTimeout(showTaskOverlay, moveDelay);
            } else {
                 // Knop wordt ingeschakeld als we de finish NIET bereiken
                 if (project.position < totalSpaces && diceBtn) {
                     diceBtn.disabled = false;
                 }
                 updateDisplay();
            }
        }, moveDelay);
    }
    
   function showTaskOverlay() {
        const taskData = tasksPerSpace[project.position];
        if (!taskData) return;
        
        // Reset en toon de hoofdoverlay
        taskOverlay.classList.add('active');
        taskContent.innerHTML = `<strong>VAK ${project.position}: ${spaceNames[project.position]}</strong><br>${taskData.opdracht}`;
        decisionOptionsDiv.innerHTML = ''; // Maak de knoppen leeg

        // Knoppen toevoegen (zoals in de eerdere versies)
        taskData.opties.forEach(optie => {
            const btn = document.createElement('button');
            btn.textContent = optie.label;
            btn.classList.add('decision-btn');
            btn.onclick = () => handleDecision(optie.actie, optie.target);
            decisionOptionsDiv.appendChild(btn);
        });
        
        if (diceBtn) diceBtn.disabled = true;
    }

    // Gecorrigeerde logica voor de dobbelknop na een beslissing
    function handleDecision(action, targetSpace) {
        taskOverlay.classList.remove('active');
        
        if (action === 'archive') {
             alert("PROJECT NO-GO: Het project wordt gearchiveerd. Terug naar START.");
             project.position = 0; 
             movePawn(0); 
             if (diceBtn) diceBtn.disabled = false; // Naar start, mag dobbelen
        } else if (action === 'complete') {
             if (targetSpace > totalSpaces) {
                 project.position = totalSpaces;
                 movePawn(totalSpaces); 
                 // Finish bereikt, handleFinish schakelt uit.
             } else {
                 alert(`Vak ${project.position} afgerond! Nu naar Vak ${targetSpace}.`);
                 project.position = targetSpace;
                 movePawn(targetSpace);
                 // Taak voltooid, mag meteen door met dobbelen (of nieuwe taak op volgend vak)
                 if (diceBtn) diceBtn.disabled = false;
             }
        } else if (action === 'stay') {
            alert(`Taak nog niet voltooid. Project blijft op Vak ${project.position}. Los de taak op en dobbel opnieuw!`);
            // Op hetzelfde vak, mag opnieuw dobbelen
            if (diceBtn) diceBtn.disabled = false;
        }
        
        updateDisplay();
    }
    
    function handleFinish() {
        if (board) board.style.opacity = 0.5;
        if (diceBtn) {
            diceBtn.disabled = true;
            diceBtn.textContent = "WINST! Project Voltooid.";
        }
        if (currentPositionDisplay) currentPositionDisplay.textContent = `VAK ${totalSpaces}: ${spaceNames[totalSpaces]}`;
        alert(`WINST! Project ${project.name} is succesvol geïmplementeerd en geëvalueerd!`);
    }

    function updateDisplay() {
        const projectNameSpan = document.getElementById('current-project-name');
        const horizonSpan = document.getElementById('current-horizon');
        
        if (projectNameSpan) projectNameSpan.textContent = project.name;
        if (horizonSpan) horizonSpan.textContent = project.horizon || 'N/A';
        if (currentPositionDisplay) currentPositionDisplay.textContent = `VAK ${project.position}: ${spaceNames[project.position] || 'FINISH'}`;
    }

    // --- CHATBOT FUNCTIES ---
    
    /** Voegt een bericht toe aan het chatvenster. */
    function addChatMessage(sender, message, isBot = false) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chat-message');
        msgDiv.classList.add(isBot ? 'bot-message' : 'user-message');
        msgDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll naar onder
    }
    
    /** Simuleert een AI-antwoord op basis van de input. */
    function handleChat(taskData, playerInput) {
        const input = playerInput.toUpperCase().trim();
        addChatMessage("Jij", playerInput, false);
        chatInput.value = ''; // Input leegmaken

        let botResponse = "Dit is een simulatie. Voor meer informatie over de gevraagde taak, kun je vragen over de **specifieke termen** (bijv. 'JTBD', 'MVP', 'risico') stellen.";
        
        // Simpele Regelgebaseerde AI: Antwoorden gebaseerd op de fase
        const currentSpace = project.position;

        if (currentSpace === 1 && input.includes("JTBD")) {
            botResponse = "De Job to be Done is het centrale probleem van de klant. In deze fase moet je bevestigen dat je de risicovolle aanname hebt gedefinieerd op basis van de JTBD.";
        } else if (currentSpace === 2 && input.includes("RISICO")) {
            botResponse = "Financieel en Juridisch risico: Zijn deze getoetst? Je moet bewijzen dat je genoeg bewijs hebt na de MVP-test om deze risico's te mitigeren.";
        } else if (currentSpace === 3 && input.includes("MVP")) {
             botResponse = "De MVP (Minimum Viable Product) is je eerste testversie. De vraag is: Is deze al opgeleverd en getest door de 'early adopters'?";
        } else if (input.includes("JA")) {
            botResponse = "Mooi. Het lijkt erop dat je de gevraagde informatie hebt. Keer terug naar de taak om je besluit te nemen.";
        }

        setTimeout(() => addChatMessage("Chatbot", botResponse, true), 800);
    }
    
    // --- CHATBOT LISTENERS INSTELLEN (onderaan bij INITIALISATIE) ---

    // --- EVENT LISTENERS ---

    horizonBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            project.horizon = btn.dataset.horizon;
            selectedHorizonInfo.textContent = `Gekozen: ${project.horizon}. Focus op ${project.horizon === 'H1' ? 'Optimalisatie (Winst)' : project.horizon === 'H3' ? 'Disruptie (Zoeken)' : 'Vernieuwing (Opschaling)'}.`;
            horizonBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            startProjectBtn.disabled = false;
        });
    });

    // Start Project - Zorgt ervoor dat de dobbelknop direct geactiveerd wordt
    startProjectBtn.addEventListener('click', () => {
        if (!project.horizon) return;
        
        const projectNameInput = prompt("Geef dit project een naam:") || "Innovatie Project Alpha";
        project.name = projectNameInput;
        
        startOverlay.classList.remove('active');
        
        project.position = 0; 
        movePawn(0); 
        
        // ZEKERHEIDSFIX: Activeer de dobbelknop expliciet, zodat het spel kan beginnen.
        if (diceBtn) {
            diceBtn.disabled = false; 
            diceBtn.textContent = "DOBBELEN";
        }
        
        alert(`Project ${project.name} gestart op H${project.horizon}! Klik op DOBBELEN om te starten.`);
        updateDisplay();
    });

    // Dobbelknop Listener
    if (diceBtn) {
        diceBtn.addEventListener('click', handleDiceRoll);
    }

    // --- CHATBOT POPUP LISTENERS ---

    // Open de chatbot
    if (openChatbotBtn) {
        openChatbotBtn.addEventListener('click', () => {
            chatbotOverlay.classList.remove('hidden-overlay');
            chatbotOverlay.classList.add('active');
            
            // Startbericht bij openen
            if (chatMessages.childElementCount === 0) {
                 addChatMessage("Chatbot", `Hallo, ik ben de Innovatie Assistent. Waar kan ik je mee helpen? Vraag over termen of de taak van Vak ${project.position}.`, true);
            }
        });
    }

    // Sluit de chatbot
    if (closeChatbotBtn) {
        closeChatbotBtn.addEventListener('click', () => {
            chatbotOverlay.classList.remove('active');
            chatbotOverlay.classList.add('hidden-overlay');
        });
    }

    // Verzend de chat (via knop of Enter)
    const currentTaskData = tasksPerSpace[project.position];
    if (chatSendBtn) {
        chatSendBtn.onclick = () => handleChat(currentTaskData, chatInput.value);
    }
    if (chatInput) {
        chatInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                handleChat(currentTaskData, chatInput.value);
            }
        };
    }

    
    // --- INITIALISATIE ---
    
    window.requestAnimationFrame(() => {
        movePawn(0); 
        updateDisplay();
    });

    // Schakel de dobbelknop standaard uit bij het laden
    // if (diceBtn) {
    //     diceBtn.disabled = true;
    //     diceBtn.textContent = "DOBBELEN";
    // }

});