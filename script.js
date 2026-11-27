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
        y: 330,
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
function gameLoop(timestamp) {

    if (!game.running) return;

    if (!game.paused) {

        updatePlayer(timestamp);

        updateClock(timestamp);

        updateCustomers(timestamp);

    }

    drawGame();

    requestAnimationFrame(gameLoop);

}

//player movement
function updatePlayer(timestamp) {

    const player = game.player;

    let moving = false;


    if (game.keys["a"] || game.keys["arrowleft"]) {

        player.x -= player.speed;

        player.facing = -1;

        moving = true;

    }


    if (game.keys["d"] || game.keys["arrowright"]) {

        player.x += player.speed;

        player.facing = 1;

        moving = true;

    }


    player.x = Math.max(
        0,
        Math.min(canvas.width - player.width, player.x)
    );


    if (moving && timestamp - game.footstepTimer > 350) {

        playSound("footsteps");

        game.footstepTimer = timestamp;

    }

}


//game clock
function updateClock(timestamp) {

    if (timestamp - game.lastClock < 1500) return;

    game.lastClock = timestamp;

    game.minutes++;

    updateUI();


    // Switch to evening music later in the day

    if (game.minutes === 16 * 60) {

        playEveningMusic();

    }


    // Close the bakery at 5 PM

    if (game.minutes >= 17 * 60) {

        endDay();

    }

}


//customer arrival
function updateCustomers(timestamp) {

    if (game.minutes >= 17 * 60) return;

    const arrivalTime = Math.max(
        9000,
        18000 - game.day * 700
    );


    if (
        timestamp - game.lastCustomer > arrivalTime &&
        game.customers.length < 3
    ) {

        addCustomer();

        game.lastCustomer = timestamp;

    }


    game.customers.forEach(customer => {

        if (customer.state === "entering") {

            customer.x += 1.2;

            if (customer.x >= customer.targetX) {

                customer.state = "waiting";

            }

        }


        if (customer.state === "waiting") {

            customer.patience -= 0.025;

            if (customer.patience <= 0) {

                customer.state = "leaving";

                showToast(`${customer.name} had to leave.`);

            }

        }


        if (customer.state === "leaving") {

            customer.x -= 2;

        }

    });


    game.customers = game.customers.filter(customer => {

        return customer.x > -100;

    });


    updateOrders();

}

//add customer
function addCustomer() {

    const person = customerTypes[
        Math.floor(Math.random() * customerTypes.length)
    ];


    const productKeys = Object.keys(products);

    const requestedProduct = Math.random() < 0.65
        ? person.favorite
        : productKeys[Math.floor(Math.random() * productKeys.length)];


    game.customers.push({

        name: person.name,
        image: person.image,

        greeting: person.greeting,

        order: requestedProduct,

        x: -80,
        y: 330,
        targetX: 650 + Math.random() * 50,

        state: "entering",

        patience: 100

    });


    playSound("doorbell");

    showToast(`${person.name} just walked in!`);

    updateOrders();

}

//order display
function updateOrders() {

    const waiting = game.customers.filter(customer => {

        return customer.state === "waiting";

    });


    ui.waiting.textContent = `${waiting.length} waiting`;


    if (waiting.length === 0) {

        ui.orders.innerHTML = `
            <p class="empty-text">No customers yet.</p>
        `;

        return;

    }


    ui.orders.innerHTML = waiting.map(customer => {

        const product = products[customer.order];

        return `

            <div class="order-card">

                <img
                    src="${assetFiles[product.image]}"
                    alt="${product.name}"
                >

                <div class="order-info">

                    <strong>${customer.name}</strong>

                    <span>${product.name}</span>

                </div>

            </div>

        `;

    }).join("");

}

//hud update
function updateUI() {

    ui.day.textContent = String(game.day).padStart(2, "0");

    const hour = Math.floor(game.minutes / 60);

    const minute = game.minutes % 60;

    const displayHour = hour % 12 || 12;

    ui.time.textContent =
        `${String(displayHour).padStart(2, "0")}:` +
        `${String(minute).padStart(2, "0")} ` +
        `${hour >= 12 ? "PM" : "AM"}`;


    ui.money.textContent = `${game.money} coins`;

    ui.croissant.textContent = game.stock.croissant;

    ui.cookie.textContent = game.stock.cookie;

    ui.coffee.textContent = game.stock.coffee;

    updateOrders();

}

//nearest object
function getNearestObject() {

    const playerCenter =
        game.player.x + game.player.width / 2;

    let nearest = null;

    let shortestDistance = Infinity;


    objects.forEach(object => {

        const objectCenter =
            object.x + object.width / 2;

        const distance = Math.abs(
            playerCenter - objectCenter
        );


        if (distance < shortestDistance) {

            shortestDistance = distance;

            nearest = object;

        }

    });


    if (shortestDistance > 115) return null;

    return nearest;

}

//interaction
function interact() {

    const object = getNearestObject();

    if (!object) {

        showToast("Walk closer to an object first.");

        return;

    }


    playSound("click");


    if (object.id === "oven") {

        openOven();

    }


    if (object.id === "display") {

        showInventory();

    }


    if (object.id === "coffeeMachine") {

        openCoffeeMachine();

    }


    if (object.id === "register") {

        serveCustomer();

    }


    if (object.id === "shelves") {

        openShelves();

    }

}



// dialogue window content
function setInteraction(title, subtitle, content, buttons) {

    document.getElementById("modalTitle").textContent = title;

    document.getElementById("modalSubtitle").textContent = subtitle;

    document.getElementById("modalContent").innerHTML = content;

    document.getElementById("modalButtons").innerHTML = buttons;

    // Make dynamically created buttons work
    document.querySelectorAll("#modalButtons [data-close]").forEach(button => {
        button.addEventListener("click", () => {
            playSound("click");
            closeModal(button.dataset.close);
        });
    });

    openModal("interactionModal");

}


//oven
function openOven() {

    const bakedGoods = [

        "croissant",
        "strawberryCake",
        "cinnamonRoll",
        "cookie",
        "sourdough",
        "muffin"

    ];


    const buttons = bakedGoods.map(key => {

        const product = products[key];

        return `

            <button
                class="action-button"
                data-product="${key}">

                Bake ${product.name}

            </button>

        `;

    }).join("");


    setInteraction(
        "The Oven",
        "BAKING CORNER",
        "<p>What would you like to prepare?</p>",
        buttons
    );


    document.querySelectorAll("[data-product]").forEach(button => {

        button.addEventListener("click", () => {

            bakeProduct(button.dataset.product);

        });

    });

}


//coffee machine

function openCoffeeMachine() {

    const buttons = `

        <button class="action-button" data-product="coffee">
            Make Coffee
        </button>

        <button class="action-button secondary-action" data-product="strawberryMilk">
            Make Strawberry Milk
        </button>

    `;


    setInteraction(
        "Drinks Station",
        "FRESHLY PREPARED",
        "<p>Time to make something refreshing.</p>",
        buttons
    );


    document.querySelectorAll("[data-product]").forEach(button => {

        button.addEventListener("click", () => {

            bakeProduct(button.dataset.product);

        });

    });

}

//shelves
function openShelves() {

    const ingredientNames = {

        flour: "Flour",
        butter: "Butter",
        sugar: "Sugar",
        strawberries: "Strawberries",
        chocolate: "Chocolate",
        cinnamon: "Cinnamon",
        coffeeBeans: "Coffee Beans",
        milk: "Milk",
        blueberries: "Blueberries"

    };


    const ingredientList = Object.entries(game.ingredients).map(([key, amount]) => {

        return `<p><b>${ingredientNames[key]}</b>: ${amount}</p>`;

    }).join("");


    setInteraction(
        "Ingredient Shelves",
        "KITCHEN STORAGE",
        ingredientList,
        `<button class="action-button" data-close="interactionModal">Done</button>`
    );

}

//bake product
function bakeProduct(key) {

    const product = products[key];

    if (!product) return;


    // Check ingredients before starting

    for (const ingredient in product.recipe) {

        if (game.ingredients[ingredient] < product.recipe[ingredient]) {

            showToast(`Not enough ${ingredient}.`);

            return;

        }

    }


    // Use ingredients

    for (const ingredient in product.recipe) {

        game.ingredients[ingredient] -= product.recipe[ingredient];

    }


    closeModal("interactionModal");

    playSound("baking");

    showToast(`Preparing ${product.name}...`);


    setTimeout(() => {

        game.stock[key]++;

        updateUI();

        showToast(`${product.name} is ready!`);

    }, product.time);

}

//serve customer
function serveCustomer() {

    const customer = game.customers.find(person => {

        return person.state === "waiting";

    });


    if (!customer) {

        showToast("Nobody is waiting at the counter.");

        return;

    }


    const product = products[customer.order];


    if (game.stock[customer.order] <= 0) {

        showToast(`You're out of ${product.name}!`);

        return;

    }


    game.stock[customer.order]--;

    game.money += product.price;

    game.daySales += product.price;

    game.served++;


    customer.state = "leaving";


    playSound("register");

    showToast(
        `${customer.name} bought ${product.name}! +${product.price} coins`
    );


    updateUI();

}

//inventory window
function showInventory() {

    const inventory = document.getElementById("inventoryContent");


    inventory.innerHTML = Object.entries(products).map(([key, product]) => {

        return `

            <div class="inventory-product">

                <img
                    src="${assetFiles[product.image]}"
                    alt="${product.name}"
                >

                <div>

                    <strong>${product.name}</strong>

                    <span>Stock: ${game.stock[key]}</span>

                </div>

            </div>

        `;

    }).join("");


    openModal("inventoryModal");

}

//end of day
function endDay() {

    game.paused = true;

    game.customers = [];

    sounds.music.pause();

    playEveningMusic();


    document.getElementById("daySummary").innerHTML = `

        <p>You served <b>${game.served}</b> customers today.</p>

        <p>Today's sales: <b>${game.daySales} coins</b></p>

        <p>Total wallet: <b>${game.money} coins</b></p>

        <p>Thank you for another lovely day at the bakery.</p>

    `;


    openModal("dayModal");

}

//next day
document.getElementById("nextDayButton").addEventListener("click", () => {

    playSound("click");

    closeModal("dayModal");

    game.day++;

    game.minutes = 8 * 60;

    game.served = 0;

    game.daySales = 0;

    game.customers = [];


    game.lastClock = performance.now();

    game.lastCustomer = performance.now();


    updateUI();

    playMusic();

    showToast(`Day ${game.day}: Time to open!`);

});

//draw the game
function drawGame() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);


    // Draw the actual bakery background

    if (images.interior) {

        ctx.drawImage(
            images.interior,
            0,
            0,
            canvas.width,
            canvas.height
        );

    } else {

        ctx.fillStyle = "#e9c9a8";

        ctx.fillRect(0, 0, canvas.width, canvas.height);

    }


    // Draw bakery furniture

    objects.forEach(object => {

        drawImage(
            object.image,
            object.x,
            object.y,
            object.width,
            object.height
        );

    });


    // Draw customers

    game.customers.forEach(drawCustomer);


    // Draw player last so the player appears in front

    drawPlayer();


    // Show interaction prompt

    const nearest = getNearestObject();

    if (nearest && !game.paused) {

        promptBox.textContent = `Press E to use ${nearest.label}`;

        promptBox.classList.remove("hidden");

    } else {

        promptBox.classList.add("hidden");

    }

}


// DRAW PLAYER SPRITE

function drawPlayer() {

    const player = game.player;

    const image = images.player;

    if (!image) return;


    ctx.save();


    // Flip the character when walking left

    if (player.facing === -1) {

        ctx.translate(
            player.x + player.width,
            player.y
        );

        ctx.scale(-1, 1);

        ctx.drawImage(
            image,
            0,
            0,
            player.width,
            player.height
        );

    } else {

        ctx.drawImage(
            image,
            player.x,
            player.y,
            player.width,
            player.height
        );

    }


    ctx.restore();

}


// DRAW CUSTOMER SPRITES

function drawCustomer(customer) {

    const image = images[customer.image];

    if (!image) return;


    ctx.drawImage(
        image,
        customer.x,
        customer.y || 0,
        64,
        96
    );


    // Small order bubble

    if (customer.state === "waiting") {

        const product = products[customer.order];

        ctx.fillStyle = "#fff5e8";

        ctx.fillRect(
            customer.x + 8,
            (customer.y || 0) - 38,
            45,
            30
        );


        ctx.strokeStyle = "#8b664f";

        ctx.strokeRect(
            customer.x + 8,
            (customer.y || 0) - 38,
            45,
            30
        );


        drawImage(
            product.image,
            customer.x + 16,
            (customer.y || 0) - 34,
            28,
            22
        );

    }

}


// END OF FILE

// Load all images before allowing the game to start.

async function initializeGame() {

    await loadImages();

    console.log("Bun Intended assets loaded.");

    updateUI();

    document.body.classList.add("game-ready");

}


// Start loading the game

initializeGame();