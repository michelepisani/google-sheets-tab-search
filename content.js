// content.js - Versione 12.1 (Fix Focus Automatico)

// Ascolto del click in fase di cattura
document.addEventListener('mousedown', function(e) {
    // Verifica se il click è avvenuto dentro il pulsante "Tutti i fogli" (classe o attributi)
    const target = e.target;
    const btn = target.closest('.docs-sheet-all-button') || 
                target.closest('[data-tooltip="Tutti i fogli"]') ||
                target.closest('[aria-label="Tutti i fogli"]');
    
    if (btn) {
        // Proviamo a cercare il menu in 3 momenti diversi
        setTimeout(() => hijackMenu(), 50);
        setTimeout(() => hijackMenu(), 150);
        setTimeout(() => hijackMenu(), 300);
    }
}, true); 

function hijackMenu() {
    if (document.getElementById('sheet-search-replica')) return;

    // Cerca il menu originale visibile
    const menus = document.querySelectorAll('.goog-menu.goog-menu-vertical');
    let realMenu = null;

    menus.forEach(m => {
        if (m.offsetWidth > 0 && m.offsetHeight > 0 && m.style.display !== 'none') {
            if (m.querySelectorAll('.goog-menuitem').length > 0) {
                realMenu = m;
            }
        }
    });

    if (!realMenu) return;

    createReplicaMenu(realMenu);
}

function createReplicaMenu(realMenu) {
    const rect = realMenu.getBoundingClientRect();
    
    // Nascondi originale
    realMenu.style.opacity = '0';
    realMenu.style.pointerEvents = 'none';

    // Crea Replica
    const replica = document.createElement('div');
    replica.id = 'sheet-search-replica';
    
    // Stile Replica
    Object.assign(replica.style, {
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        maxHeight: `${rect.height}px`,
        backgroundColor: 'white',
        boxShadow: '0 2px 6px 2px rgba(0,0,0,0.15)',
        border: '1px solid #dadce0',
        zIndex: '100000',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '0 0 4px 4px',
        fontFamily: 'Roboto, Arial, sans-serif'
    });

    // --- Header Ricerca ---
    const searchBox = document.createElement('div');
    Object.assign(searchBox.style, {
        padding: '8px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa',
        flexShrink: '0'
    });

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '🔍 Cerca tab...'; // O 'Search sheets...' se hai messo inglese
    Object.assign(input.style, {
        width: '100%',
        padding: '8px',
        boxSizing: 'border-box',
        border: '1px solid #1a73e8',
        borderRadius: '4px',
        outline: 'none',
        fontSize: '13px'
    });

    // Protezione Input
    ['mousedown', 'click', 'keydown'].forEach(evt => 
        input.addEventListener(evt, e => e.stopPropagation())
    );

    searchBox.appendChild(input);
    replica.appendChild(searchBox);

    // --- Lista Fogli ---
    const listContainer = document.createElement('div');
    Object.assign(listContainer.style, {
        overflowY: 'auto',
        flex: '1',
        padding: '6px 0'
    });

    const originalItems = realMenu.querySelectorAll('.goog-menuitem');
    
    originalItems.forEach(origItem => {
        const item = document.createElement('div');
        item.textContent = origItem.textContent;
        
        Object.assign(item.style, {
            padding: '6px 20px',
            fontSize: '13px',
            cursor: 'pointer',
            color: '#333',
            whiteSpace: 'nowrap',
            display: 'block'
        });

        // Hover
        item.addEventListener('mouseenter', () => item.style.backgroundColor = '#f1f3f4');
        item.addEventListener('mouseleave', () => item.style.backgroundColor = 'white');

        // Click Bridge
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            closeReplica();
            
            const opts = {bubbles: true, cancelable: true, view: window};
            origItem.dispatchEvent(new MouseEvent('mousedown', opts));
            origItem.dispatchEvent(new MouseEvent('mouseup', opts));
            origItem.click(); 
        });

        listContainer.appendChild(item);
    });

    replica.appendChild(listContainer);
    document.body.appendChild(replica);

    // --- FOCUS AGGRESSIVO (La modifica è qui) ---
    // Proviamo a dare il focus ripetutamente per vincere contro Google Sheets
    input.focus(); // Tentativo 1 immediato
    setTimeout(() => input.focus(), 50);  // Tentativo 2
    setTimeout(() => {
        input.focus();
        // Controllo finale: se non ha il focus, forza un ultima volta
        if (document.activeElement !== input) input.focus();
    }, 150); // Tentativo 3

    // --- Logica Filtro ---
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        Array.from(listContainer.children).forEach(child => {
            const isVisible = child.textContent.toLowerCase().includes(query);
            child.style.display = isVisible ? 'block' : 'none';
        });
    });

    // --- Tasti Speciali ---
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const firstVisible = Array.from(listContainer.children).find(el => el.style.display !== 'none');
            if (firstVisible) firstVisible.click();
        }
        if (e.key === 'Escape') {
            closeReplica();
        }
    });

    // --- Chiusura (Click esterno) ---
    setTimeout(() => {
        const outsideClickListener = (e) => {
            if (!replica.contains(e.target)) {
                closeReplica();
            }
        };
        document.addEventListener('mousedown', outsideClickListener, {capture: true, once: true});
    }, 100);

    function closeReplica() {
        if (replica.parentNode) replica.parentNode.removeChild(replica);
        
        if (document.contains(realMenu)) {
            realMenu.style.opacity = '1';
            realMenu.style.pointerEvents = 'auto';
            document.body.click(); // Chiudi menu Google
        }
    }
}