const periodicRefreshPeriod = 3;
let contentScrollPosition = 0;
let selectedCategory = "";
let currentETag = "";
let hold_Periodic_Refresh = false;

Init_UI();

function Init_UI() {
    renderPosts();
    $('#createPost').on("click", async function () {
        saveContentScrollPosition();
        renderCreatePostForm();
    });
    $('#abort').on("click", async function () {
        renderPosts();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    
    $('#search').on("click", function () {
        const searchInput = $('#searchKeys');
        const header = $('#header');

        searchInput.toggleClass('show');
        showKeywords = searchInput.hasClass('show'); // enable/disable highlighting

        if (showKeywords) {
            // Expand the grid when showing the search field
            header.css('grid-template-columns', '50px auto auto 30px 30px 30px');
            searchInput.focus();
        } else {
            // Restore the grid and clear highlights when hiding the search field
            header.css('grid-template-columns', '50px auto 30px 30px 30px');
            searchInput.val('');
            renderPosts(); // re-render to remove old highlights
        }
    });
    
    $('#searchKeys').on("input", function () {
        if ($(this).val().trim().length > 0)
            highlightKeywords();
        else
            removeHighlights();
    });

    start_Periodic_Refresh();
}

function start_Periodic_Refresh() {
    setInterval(async () => {
        if (!hold_Periodic_Refresh) {
            await Posts_API.Head();
            if (currentETag != Posts_API.Etag) {
                currentETag = Posts_API.Etag;
                saveContentScrollPosition();
                renderPosts();
            }
        }
    }, periodicRefreshPeriod * 1000);
}

function renderAbout() {
    hold_Periodic_Refresh = true;
    saveContentScrollPosition();
    eraseContent();
    $("#createPost").hide();
    $("#dropdownMenu").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(`
        <div class="aboutContainer">
            <h2>Gestionnaire de publications</h2>
            <hr>
            <p>Petite application de gestion de publications à titre de démonstration d'interface utilisateur monopage réactive.</p>
            <p>Auteur: Olivier Briand-Champagne & Matis Grenier</p>
            <p>Collège Lionel-Groulx, automne 2025</p>
        </div>
    `);
}

function updateDropDownMenu(categories) {
    let DDMenu = $("#DDMenu");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    DDMenu.empty();
    DDMenu.append(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
    `);
    DDMenu.append(`<div class="dropdown-divider"></div>`);
    categories.forEach(category => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append(`
            <div class="dropdown-item menuItemLayout category">
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `);
    });
    DDMenu.append(`<div class="dropdown-divider"></div>`);
    DDMenu.append(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
    `);

    $('#aboutCmd').on("click", renderAbout);
    $('#allCatCmd').on("click", function () {
        selectedCategory = "";
        renderPosts();
    });
    $('.category').on("click", function () {
        selectedCategory = $(this).text().trim();
        renderPosts();
    });
}

function compileCategories(posts) {
    let categories = [];
    if (posts) {
        posts.forEach(post => {
            if (!categories.includes(post.Category))
                categories.push(post.Category);
        });
        updateDropDownMenu(categories);
    }
}

async function renderPosts( desc = true) {
    hold_Periodic_Refresh = false;
    showWaitingGif();
    $("#actionTitle").text("Liste des publications");
    $("#createPost").show();
    $("#dropdownMenu").show();
    $("#abort").hide();
    let Posts = await Posts_API.Get();
    currentETag = Posts_API.Etag;
    compileCategories(Posts);
    eraseContent();

    if (Posts !== null) {
        Posts.sort((a, b) => {
            if (desc)
                return new Date(b.Creation) - new Date(a.Creation); // newest first
            else
                return new Date(a.Creation) - new Date(b.Creation); // oldest first
        });

        Posts.forEach(Post => {
            if (selectedCategory === "" || selectedCategory === Post.Category)
                $("#content").append(renderPost(Post));
        });
        restoreContentScrollPosition();

        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditPostForm($(this).attr("editPostId"));
        });
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeletePostForm($(this).attr("deletePostId"));
        });

        $(".expandCmd").off("click").on("click", function () {
            const id = $(this).attr("toggleId");
            $(`#postText_${id}`).removeClass("hideExtra").addClass("showExtra");
            $(this).hide();
            $(`.collapseCmd[toggleId="${id}"]`).show();
        });
        $(".collapseCmd").off("click").on("click", function () {
            const id = $(this).attr("toggleId");
            $(`#postText_${id}`).removeClass("showExtra").addClass("hideExtra");
            $(this).hide();
            $(`.expandCmd[toggleId="${id}"]`).show();
        });
    } else {
        renderError();
    }
}

function showWaitingGif() {
    $("#content").empty().append(`<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>`);
}

function eraseContent() { $("#content").empty(); }
function saveContentScrollPosition() { contentScrollPosition = $("#content")[0].scrollTop; }
function restoreContentScrollPosition() { $("#content")[0].scrollTop = contentScrollPosition; }

function renderError(message = "") {
    message = message == "" ? Posts_API.currentHttpError : message;
    eraseContent();
    $("#content").append(`<div class="errorContainer">${message}</div>`);
}

function renderCreatePostForm() { renderPostForm(); }

async function renderEditPostForm(id) {
    showWaitingGif();
    let Post = await Posts_API.Get(id);
    if (Post !== null)
        renderPostForm(Post);
    else
        renderError("Publication introuvable!");
}

async function renderDeletePostForm(id) {
    showWaitingGif();
    $("#createPost").hide();
    $("#dropdownMenu").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let Post = await Posts_API.Get(id);
    eraseContent();

    if (Post !== null) {
        let dateString = convertToFrenchDate(UTC_To_Local(Post.Creation));
        $("#content").append(`
            <div class="PostdeleteForm">
                <h4>Effacer la publication suivante?</h4>
                <br>
                <div class="PostRow" Post_id="${Post.Id}">
                    <div class="PostContainer noselect">
                        <!-- Header (Category + Title + Commands) -->
                        <div class="PostHeader">
                            <span class="PostCategory">${Post.Category}</span>
                            <div class="PostTitleLine">
                                <span class="PostTitle hideExtra">${Post.Title}</span>
                            </div>
                        </div>

                        <!-- Image -->
                        <div class="PostImageUI" style="background-image: url('${Post.Image}');"></div>

                        <!-- Date -->
                        <div class="PostDate">${dateString}</div>

                        <!-- Text -->
                        <div class="PostTextWrapper">
                            <p class="PostText hideExtra" id="postText_${Post.Id}">${Post.Text}</p>
                            <span class="expandCmd cmdIcon fa fa-angle-double-down" title="Agrandir le texte" toggleId="${Post.Id}"></span>
                            <span class="collapseCmd cmdIcon fa fa-angle-double-up" title="Réduire le texte" toggleId="${Post.Id}" style="display:none;"></span>
                        </div>
                    </div>
                </div>
                <br>
                <input type="button" value="Effacer" id="deletePost" class="btn btn-primary">
                <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
            </div>
        `);
        $('#deletePost').on("click", async function () {
            showWaitingGif();
            let result = await Posts_API.Delete(Post.Id);
            if (result)
                renderPosts();
            else
                renderError();
        });
        $('#cancel').on("click", renderPosts);
        $(".expandCmd").off("click").on("click", function () {
            const id = $(this).attr("toggleId");
            $(`#postText_${id}`).removeClass("hideExtra").addClass("showExtra");
            $(this).hide();
            $(`.collapseCmd[toggleId="${id}"]`).show();
        });
        $(".collapseCmd").off("click").on("click", function () {
            const id = $(this).attr("toggleId");
            $(`#postText_${id}`).removeClass("showExtra").addClass("hideExtra");
            $(this).hide();
            $(`.expandCmd[toggleId="${id}"]`).show();
        });
    } else {
        renderError("Publication introuvable!");
    }
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    let jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function newPost() {
    return {
        Id: "",
        Title: "",
        Text: "",
        Category: "",
        Image: "",
        Creation: Local_to_UTC(Date.now())
    };
}

function renderPostForm(Post = null) {
    hold_Periodic_Refresh = true;
    $("#createPost").hide();
    $("#dropdownMenu").hide();
    $("#abort").show();
    eraseContent();

    let create = Post == null;
    if (create) Post = newPost();

    $("#actionTitle").text(create ? "Création" : "Modification");

    let keepDateCheckbox = "";
    if (!create) {
        keepDateCheckbox = `
            <div class="form-check" style="margin-top:10px;">
                <input class="form-check-input" type="checkbox" id="keepCreationDate" checked>
                <label class="form-check-label" for="keepCreationDate">
                    Conserver la date de création
                </label>
            </div>
        `;
    }

    $("#content").append(`
        <form class="form" id="postForm">
            <input type="hidden" name="Id" value="${Post.Id}"/>
            <input type="hidden" name="Creation" value="${Post.Creation}">


            <label for="Title" class="form-label">Titre</label>
            <input class="form-control" name="Title" id="Title" required value="${Post.Title}" />
            
            <label for="Text" class="form-label">Texte</label>
            <textarea class="form-control" name="Text" id="Text" rows="4" required>${Post.Text}</textarea>

            <label for="Category" class="form-label">Catégorie</label>
            <input class="form-control" name="Category" id="Category" required value="${Post.Category}" />

  
            <!-- nécessite le fichier javascript 'imageControl.js' -->
            <label class="form-label">Image</label>
            <div class="imageUploader" 
                id="${Post.Id}" 
                controlId="Image"
                imageSrc="${Post.Image}"
                newImage="true"
                waitingImage="Loading_icon.gif">
            </div>

            ${keepDateCheckbox}

            <span class="field-validation-valid text-danger" data-valmsg-for="PostImage" data-valmsg-replace="true"></span>

            <br>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initImageUploaders();
    initFormValidation(); 
    
    $('#postForm').on("submit", async function (event) {
        event.preventDefault();
        let Post = getFormData($("#postForm"));

        if (!create) {
            const keepCreation = $('#keepCreationDate').is(':checked');
            if (!keepCreation) {
                Post.Creation = Local_to_UTC(Date.now());
            }
        }

        showWaitingGif();
        console.log(Post);
        let result = await Posts_API.Save(Post, create);
        if (result)
            renderPosts();
        else {
            if (Posts_API.currentStatus == 409)
                renderError("Erreur: Conflit d'identifiant ou de titre...");
            else
                renderError();
        }
    });
    $('#cancel').on("click", renderPosts);
}

function renderPost(Post) {
    let dateString = convertToFrenchDate(UTC_To_Local(Post.Creation));

    return `
    <div class="PostRow" Post_id="${Post.Id}">
        <div class="PostContainer noselect">

            <!-- Header -->
            <div class="PostHeader">
                <span class="PostCategory">${Post.Category}</span>
                <div class="PostTitleLine">
                    <span class="PostTitle hideExtra">${Post.Title}</span>
                    <div class="PostHeaderCmds">
                        <span class="editCmd cmdIcon fa fa-pencil" editPostId="${Post.Id}" title="Modifier ${Post.Title}"></span>
                        <span class="deleteCmd cmdIcon fa fa-trash" deletePostId="${Post.Id}" title="Effacer ${Post.Title}"></span>
                    </div>
                </div>
            </div>

            <!-- Image -->
            <div class="PostImageUI" style="background-image: url('${Post.Image}');"></div>

            <!-- Date -->
            <div class="PostDate">${dateString}</div>

            <!-- Text -->
            <div class="PostTextWrapper">
                <p class="PostText hideExtra" id="postText_${Post.Id}">${Post.Text}</p>
                <div class="PostExpandPanel" id="expandPanel_${Post.Id}">
                    <span class="expandCmd cmdIcon fa fa-angle-double-down" title="Agrandir le texte" toggleId="${Post.Id}"></span>
                    <span class="collapseCmd cmdIcon fa fa-angle-double-up" title="Réduire le texte" toggleId="${Post.Id}" style="display:none;"></span>
                </div>
            </div>
        </div>
    </div>`;
}