// BUN INTENDED: main game script

// html elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const titleScreen = document.getElementById("titleScreen");
const gameScreen = document.getElementById("gameScreen");

const promptBox = document.getElementById("interactionPrompt");
const toast = document.getElementById("toast");


//asset loader
const assetFiles = {

    // Backgrounds
    interior: "assets/backgrounds/bakery-interior.png",
    exterior: "assets/backgrounds/bakery-exterior.png",
    title: "assets/backgrounds/title-background.png",

    // Characters
    player: "assets/characters/player.png",
    evelyn: "assets/characters/evelyn.png",
    leo: "assets/characters/leo.png",
    clara: "assets/characters/clara.png",
    oliver: "assets/characters/oliver.png",

    // Products
    croissant: "assets/products/croissant.png",
    strawberryCake: "assets/products/strawberry-cake.png",
    cinnamonRoll: "assets/products/cinnamon-roll.png",
    cookie: "assets/products/chocolate-cookie.png",
    sourdough: "assets/products/sourdough.png",
    muffin: "assets/products/blueberry-muffin.png",
    coffee: "assets/products/coffee.png",
    strawberryMilk: "assets/products/strawberry-milk.png",

    // Objects
    counter: "assets/objects/bakery-counter.png",
    display: "assets/objects/display-case.png",
    oven: "assets/objects/oven.png",
    coffeeMachine: "assets/objects/coffee-machine.png",
    register: "assets/objects/cash-register.png",
    shelves: "assets/objects/shelves.png",
    decorations: "assets/objects/decorations.png",

    // UI
    logo: "assets/ui/logo.png",
    dialogueBox: "assets/ui/dialogue-box.png",
    inventoryFrame: "assets/ui/inventory-frame.png",
    icons: "assets/ui/icons.png",
    cursor: "assets/ui/cursor.png"

};


const images = {};

// Load all images
function loadImages() {

    const promises = Object.entries(assetFiles).map(([name, path]) => {

        return new Promise(resolve => {

            const image = new Image();

            image.onload = () => {
                images[name] = image;
                resolve();
            };

            image.onerror = () => {

                console.warn("Could not load image:", path);

                images[name] = null;

                resolve();

            };

            image.src = path;

        });

    });

    return Promise.all(promises);

}


// Draw an image only when it loaded successfully
function drawImage(name, x, y, width, height) {

    const image = images[name];

    if (!image) return;

    ctx.drawImage(image, x, y, width, height);

}

//audio
const sounds = {
    music: new Audio("assets/audio/background-music.mp3"),
    evening: new Audio("assets/audio/evening-music.mp3"),

    doorbell: new Audio("assets/audio/doorbell.mp3"),
    footsteps: new Audio("assets/audio/footsteps.mp3"),
    baking: new Audio("assets/audio/baking.mp3"),
    register: new Audio("assets/audio/cash-register.mp3"),
    click: new Audio("assets/audio/button-click.mp3")
};


sounds.music.loop = true;
sounds.music.volume = 0.35;

sounds.evening.loop = true;
sounds.evening.volume = 0.35;


function playSound(name) {
    const sound = sounds[name];
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch(() => {
        // Browsers may block audio before the first click.
    });
}


function playMusic() {
    sounds.evening.pause();
    sounds.music.play().catch(() => {});
}


function playEveningMusic() {
    sounds.music.pause();
    sounds.evening.play().catch(() => {});
}

//game settings
const game = {

    running: false,
    paused: false,

    day: 1,
    minutes: 8 * 60,

    money: 100,
    served: 0,
    daySales: 0,

    player: {
        x: 125,
        y: 0,
        width: 64,
        height: 96,
        speed: 3,
        facing: 1
    },

    stock: {
        croissant: 2,
        strawberryCake: 1,
        cinnamonRoll: 1,
        cookie: 2,
        sourdough: 1,
        muffin: 1,
        coffee: 2,
        strawberryMilk: 1
    },

    ingredients: {
        flour: 12,
        butter: 8,
        sugar: 10,
        strawberries: 5,
        chocolate: 5,
        cinnamon: 5,
        coffeeBeans: 8,
        milk: 8,
        blueberries: 5
    },

    customers: [],

    keys: {},

    lastFrame: 0,
    lastClock: 0,
    lastCustomer: 0,

    modalOpen: false,
    currentModal: null,

    toastTimer: null,
    footstepTimer: 0

};

//products
const products = {
    croissant: {
        name: "Croissant",
        image: "croissant",
        price: 5,
        recipe: {
            flour: 1,
            butter: 1
        },
        time: 5000
    },

    strawberryCake: {
        name: "Strawberry Cake",
        image: "strawberryCake",
        price: 9,
        recipe: {
            flour: 2,
            sugar: 1,
            strawberries: 1
        },
        time: 8000
    },

    cinnamonRoll: {
        name: "Cinnamon Roll",
        image: "cinnamonRoll",
        price: 6,
        recipe: {
            flour: 1,
            butter: 1,
            cinnamon: 1
        },
        time: 6000
    },

    cookie: {
        name: "Chocolate Cookie",
        image: "cookie",
        price: 3,
        recipe: {
            flour: 1,
            sugar: 1,
            chocolate: 1
        },
        time: 4000
    },

    sourdough: {
        name: "Sourdough",
        image: "sourdough",
        price: 7,
        recipe: {
            flour: 2
        },
        time: 9000
    },

    muffin: {
        name: "Blueberry Muffin",
        image: "muffin",
        price: 5,
        recipe: {
            flour: 1,
            sugar: 1,
            blueberries: 1
        },
        time: 6000
    },

    coffee: {
        name: "Coffee",
        image: "coffee",
        price: 4,
        recipe: {
            coffeeBeans: 1,
            milk: 1
        },
        time: 3000
    },

    strawberryMilk: {
        name: "Strawberry Milk",
        image: "strawberryMilk",
        price: 4,
        recipe: {
            milk: 1,
            strawberries: 1
        },
        time: 3000
    }
};

//customers
const customerTypes = [

    {
        name: "Evelyn",
        image: "evelyn",
        favorite: "strawberryCake",
        greeting: "Your bakery always smells wonderful!"
    },

    {
        name: "Leo",
        image: "leo",
        favorite: "cookie",
        greeting: "Hey! What have you baked today?"
    },

    {
        name: "Clara",
        image: "clara",
        favorite: "croissant",
        greeting: "I was hoping to stop by today."
    },

    {
        name: "Oliver",
        image: "oliver",
        favorite: "coffee",
        greeting: "Just a quick visit before work!"
    }

];

//object positions: can be changed if background is arranged differently
const objects = [
    {
        id: "shelves",
        image: "shelves",
        x: 40,
        y: 105,
        width: 185,
        height: 150,
        label: "Shelves"
    },

    {
        id: "oven",
        image: "oven",
        x: 245,
        y: 240,
        width: 130,
        height: 180,
        label: "Oven"
    },

    {
        id: "display",
        image: "display",
        x: 425,
        y: 285,
        width: 190,
        height: 135,
        label: "Display Case"
    },

    {
        id: "coffeeMachine",
        image: "coffeeMachine",
        x: 650,
        y: 215,
        width: 105,
        height: 125,
        label: "Coffee Machine"
    },

    {
        id: "register",
        image: "register",
        x: 770,
        y: 275,
        width: 90,
        height: 75,
        label: "Cash Register"
    }
];

//interface elements
const ui = {

    day: document.getElementById("dayDisplay"),
    time: document.getElementById("timeDisplay"),
    money: document.getElementById("moneyDisplay"),

    orders: document.getElementById("ordersContainer"),
    waiting: document.getElementById("waitingCount"),

    croissant: document.getElementById("croissantStock"),
    cookie: document.getElementById("cookieStock"),
    coffee: document.getElementById("coffeeStock")

};

//small helper functions
function showToast(message) {

    toast.textContent = message;

    toast.classList.remove("hidden");

    clearTimeout(game.toastTimer);

    game.toastTimer = setTimeout(() => {

        toast.classList.add("hidden");

    }, 2200);

}


function openModal(id) {

    document.getElementById(id).classList.remove("hidden");

    game.paused = true;
    game.modalOpen = true;
    game.currentModal = id;

    promptBox.classList.add("hidden");

}


function closeModal(id) {

    document.getElementById(id).classList.add("hidden");

    if (game.currentModal === id) {

        game.currentModal = null;
        game.modalOpen = false;
        game.paused = false;

    }
}


// All close buttons
document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
        playSound("click");
        closeModal(button.dataset.close);
    });
});

//title screen buttons
document.getElementById("newGameButton").addEventListener("click", () => {

    playSound("click");

    startNewGame();

});


document.getElementById("continueButton").addEventListener("click", () => {

    playSound("click");

    loadGame();

});


document.getElementById("howToPlayButton").addEventListener("click", () => {

    playSound("click");

    openModal("helpModal");

});

//start new game
function startNewGame() {

    game.day = 1;
    game.minutes = 8 * 60;

    game.money = 100;
    game.served = 0;
    game.daySales = 0;

    game.player.x = 125;

    game.stock = {
        croissant: 2,
        strawberryCake: 1,
        cinnamonRoll: 1,
        cookie: 2,
        sourdough: 1,
        muffin: 1,
        coffee: 2,
        strawberryMilk: 1
    };

    game.ingredients = {
        flour: 12,
        butter: 8,
        sugar: 10,
        strawberries: 5,
        chocolate: 5,
        cinnamon: 5,
        coffeeBeans: 8,
        milk: 8,
        blueberries: 5
    };

    game.customers = [];

    game.paused = false;
    game.modalOpen = false;
    game.running = true;

    game.lastClock = performance.now();
    game.lastCustomer = performance.now();

    titleScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    playMusic();

    updateUI();

    showToast("Welcome to your little bakery!");

    requestAnimationFrame(gameLoop);
}

//save game
function saveGame() {

    const saveData = {

        day: game.day,
        minutes: game.minutes,

        money: game.money,
        served: game.served,

        stock: game.stock,
        ingredients: game.ingredients,

        player: {
            x: game.player.x,
            facing: game.player.facing
        }

    };

    localStorage.setItem(
        "bunIntendedSave",
        JSON.stringify(saveData)
    );

    showToast("Game saved!");

}

//load game
function loadGame() {
    const saved = localStorage.getItem("bunIntendedSave");

    if (!saved) {
        showToast("No saved game found.");

        return;
    }

    try {
        const data = JSON.parse(saved);

        game.day = data.day;
        game.minutes = data.minutes;

        game.money = data.money;
        game.served = data.served;

        game.stock = data.stock;
        game.ingredients = data.ingredients;

        game.player.x = data.player.x;
        game.player.facing = data.player.facing;

        game.customers = [];

        game.paused = false;
        game.modalOpen = false;
        game.running = true;

        game.lastClock = performance.now();
        game.lastCustomer = performance.now();

        titleScreen.classList.add("hidden");
        gameScreen.classList.remove("hidden");

        playMusic();

        updateUI();

        showToast("Welcome back!");

        requestAnimationFrame(gameLoop);

    } catch (error) {

        console.error(error);

        showToast("Your save could not be loaded.");

    }
}

//pause menu
document.getElementById("pauseButton").addEventListener("click", () => {

    playSound("click");

    openModal("pauseModal");

});


document.getElementById("resumeButton").addEventListener("click", () => {

    playSound("click");

    closeModal("pauseModal");

});


document.getElementById("saveButton").addEventListener("click", () => {

    playSound("click");

    saveGame();

});


document.getElementById("mainMenuButton").addEventListener("click", () => {

    saveGame();

    game.running = false;

    closeModal("pauseModal");

    sounds.music.pause();
    sounds.evening.pause();

    gameScreen.classList.add("hidden");
    titleScreen.classList.remove("hidden");

});


//inventory button
document.getElementById("inventoryButton").addEventListener("click", () => {

    playSound("click");

    showInventory();

});

//keyboard control
window.addEventListener("keydown", event => {

    const key = event.key.toLowerCase();

    if (["arrowleft", "arrowright", " "].includes(key)) {
        event.preventDefault();
    }

    game.keys[key] = true;


    if (key === "escape" && game.currentModal) {

        closeModal(game.currentModal);

    }


    if (key === "e" && game.running && !game.paused) {

        interact();

    }


    if (key === " " && game.running && !game.paused) {

        serveCustomer();

    }

});


window.addEventListener("keyup", event => {

    game.keys[event.key.toLowerCase()] = false;

});

//game loop
