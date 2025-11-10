// Filter by Keyword or by category
/*
Il faudra avoir dans l’interface la possibilité de filtrer les nouvelles par mot clé se trouvant dans le titre ou dans le 
texte des nouvelles (toutes les occurrences devront être en couleur de fond jaune). Il faudra aussi permettre de 
filtrer les nouvelles par catégories.
*/

let showKeywords = false;
let minKeywordLenth = 2;

//////////// Code Fourni
function highlight(text, elem) { 
    text = text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); 
    if (text.length >= minKeywordLenth) { 
        let innerHTML = elem.innerHTML; 
        let startIndex = 0; 

        while (startIndex < innerHTML.length) { 
            const normalizedHtml = innerHTML.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const index = normalizedHtml.indexOf(text, startIndex);
            if (index === -1) break;

            const highlighted = `<span class="highlight">${innerHTML.substring(index, index + text.length)}</span>`;
            innerHTML = innerHTML.substring(0, index) + highlighted + innerHTML.substring(index + text.length);
            startIndex = index + highlighted.length;
        } 
        elem.innerHTML = innerHTML; 
    } 
}

function highlightKeywords() { 
    if (showKeywords) { 
        removeHighlights(); //not the most optimised, because it might remove a kw even if its going to add it again after

        let keywords = $("#searchKeys").val().split(' '); 
        console.log(keywords);
        if (keywords.length > 0) { 
            keywords.forEach(key => { 
                let titles = document.getElementsByClassName('PostTitle'); 
                Array.from(titles).forEach(title => { 
                    highlight(key, title); 
                }) 
                let texts = document.getElementsByClassName('PostText'); 
                Array.from(texts).forEach(text => { 
                    highlight(key, text); 
                }) 
            }) 
        } 
    } 
}
//////////// Fin Code Fourni

function removeHighlights() {
    document.querySelectorAll('.highlight').forEach(span => {
        const parent = span.parentNode;
        parent.replaceChild(document.createTextNode(span.textContent), span);
        parent.normalize();
    });
}
