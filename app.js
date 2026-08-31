// ==========================================
// FIREBASE
// ==========================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ==========================================
// CONFIGURACIÓN
// ==========================================

const firebaseConfig = {

    apiKey: "AIzaSyAy69FT08SsCbmTa44sgffTRCUZ_KEyfks",

    authDomain: "familychat-ea652.firebaseapp.com",

    projectId: "familychat-ea652",

    storageBucket: "familychat-ea652.firebasestorage.app",

    messagingSenderId: "992864076339",

    appId: "1:992864076339:web:a5ddf60c234e831f495946"

};


// ==========================================
// INICIAR FIREBASE
// ==========================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);


// ==========================================
// VARIABLES
// ==========================================

let currentUser = null;

let currentFamilyCode = null;

let currentUserName = null;

let currentChatId = null;

let unsubscribeMessages = null;

let unsubscribeMembers = null;

let mode = "create";


// ==========================================
// ELEMENTOS
// ==========================================

const homeScreen =
    document.getElementById("homeScreen");

const chatScreen =
    document.getElementById("chatScreen");

const conversationScreen =
    document.getElementById("conversationScreen");

const createBtn =
    document.getElementById("createBtn");

const joinBtn =
    document.getElementById("joinBtn");

const modal =
    document.getElementById("modal");

const closeBtn =
    document.getElementById("closeBtn");

const modalTitle =
    document.getElementById("modalTitle");

const familyNameContainer =
    document.getElementById("familyNameContainer");

const codeContainer =
    document.getElementById("codeContainer");

const familyName =
    document.getElementById("familyName");

const familyCode =
    document.getElementById("familyCode");

const userName =
    document.getElementById("userName");

const continueBtn =
    document.getElementById("continueBtn");

const result =
    document.getElementById("result");

const familyTitle =
    document.getElementById("familyTitle");

const welcomeText =
    document.getElementById("welcomeText");

const logoutBtn =
    document.getElementById("logoutBtn");

const memberList =
    document.getElementById("memberList");

const chatList =
    document.getElementById("chatList");

const conversationName =
    document.getElementById("conversationName");

const messages =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const sendMessageBtn =
    document.getElementById("sendMessageBtn");

const backChatBtn =
    document.getElementById("backChatBtn");


// ==========================================
// AUTENTICACIÓN
// ==========================================

onAuthStateChanged(
    auth,
    async function (user) {

        if (!user) {
            return;
        }

        currentUser = user;

        console.log(
            "Usuario conectado:",
            currentUser.uid
        );

        // Intentar recuperar la familia
        // automáticamente

        await recuperarSesion();

    }
);


// ==========================================
// INICIAR AUTENTICACIÓN ANÓNIMA
// ==========================================

signInAnonymously(auth)
    .then(function () {

        console.log(
            "Autenticación anónima iniciada"
        );

    })
    .catch(function (error) {

        console.error(
            "Error de autenticación:",
            error
        );

    });


// ==========================================
// CREAR FAMILIA
// ==========================================

createBtn.addEventListener(
    "click",
    function () {

        mode = "create";

        modalTitle.textContent =
            "Crear familia";

        familyNameContainer
            .classList
            .remove("hidden");

        codeContainer
            .classList
            .add("hidden");

        familyName.value = "";

        familyCode.value = "";

        userName.value = "";

        result.textContent = "";

        modal.classList.remove("hidden");

    }
);


// ==========================================
// UNIRSE A FAMILIA
// ==========================================

joinBtn.addEventListener(
    "click",
    function () {

        mode = "join";

        modalTitle.textContent =
            "Unirse a una familia";

        familyNameContainer
            .classList
            .add("hidden");

        codeContainer
            .classList
            .remove("hidden");

        familyCode.value = "";

        userName.value = "";

        result.textContent = "";

        modal.classList.remove("hidden");

    }
);


// ==========================================
// CERRAR MODAL
// ==========================================

closeBtn.addEventListener(
    "click",
    function () {

        modal.classList.add("hidden");

    }
);


// ==========================================
// CONTINUAR
// ==========================================

continueBtn.addEventListener(
    "click",
    async function () {

        const name =
            userName.value.trim();


        // ------------------------------
        // COMPROBAR NOMBRE
        // ------------------------------

        if (name === "") {

            result.textContent =
                "⚠️ Escribí tu nombre.";

            return;

        }


        // ------------------------------
        // COMPROBAR FIREBASE
        // ------------------------------

        if (!currentUser) {

            result.textContent =
                "⏳ Conectando con Firebase...";

            return;

        }


        // ==================================
        // CREAR FAMILIA
        // ==================================

        if (mode === "create") {

            const family =
                familyName.value.trim();


            if (family === "") {

                result.textContent =
                    "⚠️ Escribí el nombre de la familia.";

                return;

            }


            const code =
                await generarCodigoUnico();


            result.textContent =
                "⏳ Creando familia...";


            try {

                // Crear familia

                await setDoc(
                    doc(
                        db,
                        "families",
                        code
                    ),
                    {

                        name: family,

                        owner:
                            currentUser.uid,

                        ownerName:
                            name,

                        createdAt:
                            serverTimestamp()

                    }
                );


                // Crear miembro organizador

                await setDoc(
                    doc(
                        db,
                        "families",
                        code,
                        "members",
                        currentUser.uid
                    ),
                    {

                        name: name,

                        role: "owner",

                        joinedAt:
                            serverTimestamp()

                    }
                );


                // GUARDAR SESIÓN

                guardarSesion(
                    code,
                    name
                );


                // ABRIR FAMILYCHAT

                abrirFamilyChat(
                    family,
                    name,
                    code
                );

            }

            catch (error) {

                console.error(error);

                result.textContent =
                    "❌ No se pudo crear la familia.";

            }

        }


        // ==================================
        // UNIRSE
        // ==================================

        else {

            const code =
                familyCode.value
                    .trim()
                    .toUpperCase();


            if (code === "") {

                result.textContent =
                    "⚠️ Escribí el código.";

                return;

            }


            result.textContent =
                "⏳ Buscando familia...";


            try {

                const familyRef =
                    doc(
                        db,
                        "families",
                        code
                    );


                const familySnapshot =
                    await getDoc(
                        familyRef
                    );


                // ------------------------------
                // FAMILIA NO EXISTE
                // ------------------------------

                if (
                    !familySnapshot.exists()
                ) {

                    result.textContent =
                        "❌ Ese código no existe.";

                    return;

                }


                const family =
                    familySnapshot.data();


                // ------------------------------
                // CREAR MIEMBRO
                // ------------------------------

                await setDoc(
                    doc(
                        db,
                        "families",
                        code,
                        "members",
                        currentUser.uid
                    ),
                    {

                        name: name,

                        role: "member",

                        joinedAt:
                            serverTimestamp()

                    }
                );


                // GUARDAR SESIÓN

                guardarSesion(
                    code,
                    name
                );


                // ABRIR FAMILYCHAT

                abrirFamilyChat(
                    family.name,
                    name,
                    code
                );

            }

            catch (error) {

                console.error(error);

                result.textContent =
                    "❌ No se pudo entrar a la familia.";

            }

        }

    }
);


// ==========================================
// ABRIR FAMILYCHAT
// ==========================================

function abrirFamilyChat(
    family,
    name,
    code
) {

    currentFamilyCode =
        code;

    currentUserName =
        name;


    // ------------------------------
    // CAMBIAR PANTALLA
    // ------------------------------

    homeScreen
        .classList
        .add("hidden");

    modal
        .classList
        .add("hidden");

    conversationScreen
        .classList
        .add("hidden");

    chatScreen
        .classList
        .remove("hidden");


    // ------------------------------
    // INFORMACIÓN
    // ------------------------------

    familyTitle.textContent =
        "🏠 " + family;


    welcomeText.textContent =
        "Hola, " +
        name +
        " · Código: " +
        code;


    // ------------------------------
    // CARGAR MIEMBROS
    // ------------------------------

    cargarMiembros();

}


// ==========================================
// CARGAR MIEMBROS
// ==========================================

function cargarMiembros() {

    if (!currentFamilyCode) {
        return;
    }


    // Evitar listeners duplicados

    if (unsubscribeMembers) {

        unsubscribeMembers();

    }


    const membersRef =
        collection(
            db,
            "families",
            currentFamilyCode,
            "members"
        );


    unsubscribeMembers =
        onSnapshot(
            membersRef,
            function (snapshot) {

                memberList.innerHTML = "";

                let cantidad = 0;


                snapshot.forEach(
                    function (memberDoc) {

                        const member =
                            memberDoc.data();

                        const memberId =
                            memberDoc.id;


                        // No mostrarnos a nosotros mismos

                        if (
                            memberId ===
                            currentUser.uid
                        ) {

                            return;

                        }


                        cantidad++;


                        const button =
                            document.createElement(
                                "button"
                            );


                        button.className =
                            "member-card";


                        button.innerHTML = `

                            <div class="member-avatar">
                                👤
                            </div>

                            <div class="member-info">

                                <div class="member-name">
                                    ${escapeHTML(member.name)}
                                </div>

                                <div class="member-role">
                                    ${
                                        member.role === "owner"
                                            ? "👑 Organizador"
                                            : "Miembro"
                                    }
                                </div>

                            </div>

                            <div>
                                💬
                            </div>

                        `;


                        button.addEventListener(
                            "click",
                            function () {

                                abrirConversacion(
                                    memberId,
                                    member.name
                                );

                            }
                        );


                        memberList.appendChild(
                            button
                        );

                    }
                );


                if (cantidad === 0) {

                    memberList.innerHTML = `

                        <div class="empty-message">
                            Todavía no hay otros familiares.
                        </div>

                    `;

                }

            },
            function (error) {

                console.error(
                    "Error cargando miembros:",
                    error
                );

            }
        );

}


// ==========================================
// ABRIR CONVERSACIÓN
// ==========================================

function abrirConversacion(
    otherUserId,
    otherUserName
) {

    currentChatId =
        crearChatId(
            currentUser.uid,
            otherUserId
        );


    chatScreen
        .classList
        .add("hidden");

    conversationScreen
        .classList
        .remove("hidden");


    conversationName.textContent =
        "💬 " + otherUserName;


    cargarMensajes();


    messageInput.focus();

}


// ==========================================
// CREAR ID DEL CHAT
// ==========================================

function crearChatId(
    userA,
    userB
) {

    return [
        userA,
        userB
    ]
        .sort()
        .join("_");

}


// ==========================================
// CARGAR MENSAJES
// ==========================================

function cargarMensajes() {

    if (!currentChatId) {
        return;
    }


    if (unsubscribeMessages) {

        unsubscribeMessages();

    }


    const messagesRef =
        collection(
            db,
            "families",
            currentFamilyCode,
            "chats",
            currentChatId,
            "messages"
        );


    const messagesQuery =
        query(
            messagesRef,
            orderBy(
                "createdAt",
                "asc"
            )
        );


    unsubscribeMessages =
        onSnapshot(
            messagesQuery,
            function (snapshot) {

                messages.innerHTML = "";


                if (snapshot.empty) {

                    messages.innerHTML = `

                        <div class="empty-message">
                            No hay mensajes todavía.
                        </div>

                    `;

                    return;

                }


                snapshot.forEach(
                    function (messageDoc) {

                        const message =
                            messageDoc.data();


                        const div =
                            document.createElement(
                                "div"
                            );


                        div.className =
                            "message";


                        if (
                            message.senderId ===
                            currentUser.uid
                        ) {

                            div.classList.add(
                                "mine"
                            );

                        }


                        div.innerHTML = `

                            <div class="message-author">
                                ${escapeHTML(message.senderName)}
                            </div>

                            <div>
                                ${escapeHTML(message.text)}
                            </div>

                        `;


                        messages.appendChild(
                            div
                        );

                    }
                );


                messages.scrollTop =
                    messages.scrollHeight;

            },
            function (error) {

                console.error(
                    "Error cargando mensajes:",
                    error
                );

            }
        );

}


// ==========================================
// ENVIAR MENSAJE
// ==========================================

sendMessageBtn.addEventListener(
    "click",
    enviarMensaje
);


messageInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            enviarMensaje();

        }

    }
);


async function enviarMensaje() {

    const text =
        messageInput.value.trim();


    if (
        text === "" ||
        !currentChatId ||
        !currentFamilyCode ||
        !currentUser
    ) {

        return;

    }


    try {

        const messagesRef =
            collection(
                db,
                "families",
                currentFamilyCode,
                "chats",
                currentChatId,
                "messages"
            );


        await addDoc(
            messagesRef,
            {

                text: text,

                senderId:
                    currentUser.uid,

                senderName:
                    currentUserName,

                createdAt:
                    serverTimestamp()

            }
        );


        messageInput.value = "";

        messageInput.focus();

    }

    catch (error) {

        console.error(
            "Error enviando mensaje:",
            error
        );

    }

}


// ==========================================
// VOLVER DEL CHAT
// ==========================================

backChatBtn.addEventListener(
    "click",
    function () {

        if (unsubscribeMessages) {

            unsubscribeMessages();

            unsubscribeMessages = null;

        }


        conversationScreen
            .classList
            .add("hidden");

        chatScreen
            .classList
            .remove("hidden");

    }
);


// ==========================================
// SALIR
// ==========================================

logoutBtn.addEventListener(
    "click",
    function () {

        borrarSesion();


        if (unsubscribeMembers) {

            unsubscribeMembers();

            unsubscribeMembers = null;

        }


        if (unsubscribeMessages) {

            unsubscribeMessages();

            unsubscribeMessages = null;

        }


        currentFamilyCode = null;

        currentUserName = null;

        currentChatId = null;


        conversationScreen
            .classList
            .add("hidden");

        chatScreen
            .classList
            .add("hidden");

        homeScreen
            .classList
            .remove("hidden");


        console.log(
            "Sesión cerrada"
        );

    }
);


// ==========================================
// GUARDAR SESIÓN
// ==========================================

function guardarSesion(
    familyCode,
    userName
) {

    localStorage.setItem(
        "familyChat_familyCode",
        familyCode
    );

    localStorage.setItem(
        "familyChat_userName",
        userName
    );

}


// ==========================================
// RECUPERAR SESIÓN
// ==========================================

async function recuperarSesion() {

    const savedFamilyCode =
        localStorage.getItem(
            "familyChat_familyCode"
        );

    const savedUserName =
        localStorage.getItem(
            "familyChat_userName"
        );


    if (
        !savedFamilyCode ||
        !savedUserName
    ) {

        return;

    }


    if (!currentUser) {

        return;

    }


    try {

        // ------------------------------
        // BUSCAR FAMILIA
        // ------------------------------

        const familyRef =
            doc(
                db,
                "families",
                savedFamilyCode
            );


        const familySnapshot =
            await getDoc(
                familyRef
            );


        if (
            !familySnapshot.exists()
        ) {

            borrarSesion();

            return;

        }


        const family =
            familySnapshot.data();


        // ------------------------------
        // COMPROBAR MIEMBRO
        // ------------------------------

        const memberRef =
            doc(
                db,
                "families",
                savedFamilyCode,
                "members",
                currentUser.uid
            );


        const memberSnapshot =
            await getDoc(
                memberRef
            );


        if (
            !memberSnapshot.exists()
        ) {

            borrarSesion();

            return;

        }


        // ------------------------------
        // ENTRAR AUTOMÁTICAMENTE
        // ------------------------------

        abrirFamilyChat(
            family.name,
            savedUserName,
            savedFamilyCode
        );


        console.log(
            "Sesión recuperada:",
            savedFamilyCode
        );

    }

    catch (error) {

        console.error(
            "Error recuperando sesión:",
            error
        );

    }

}


// ==========================================
// BORRAR SESIÓN
// ==========================================

function borrarSesion() {

    localStorage.removeItem(
        "familyChat_familyCode"
    );

    localStorage.removeItem(
        "familyChat_userName"
    );

}


// ==========================================
// GENERAR CÓDIGO ÚNICO
// ==========================================

async function generarCodigoUnico() {

    let code;

    let existe = true;


    while (existe) {

        code =
            generateFamilyCode();


        const familyRef =
            doc(
                db,
                "families",
                code
            );


        const snapshot =
            await getDoc(
                familyRef
            );


        existe =
            snapshot.exists();

    }


    return code;

}


// ==========================================
// GENERAR CÓDIGO
// ==========================================

function generateFamilyCode() {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "FAM-";


    for (
        let i = 0;
        i < 4;
        i++
    ) {

        const randomIndex =
            Math.floor(
                Math.random() *
                characters.length
            );


        code +=
            characters[randomIndex];

    }


    return code;

}


// ==========================================
// SEGURIDAD HTML
// ==========================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;

}