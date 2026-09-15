import Phaser from "phaser";
import { createClient } from "@supabase/supabase-js";

const GAME_WIDTH = 1000;
const GAME_HEIGHT = 600;
const WORLD_HEIGHT = 900;

const PLAYER_SPEED = 280;
const JUMP_POWER = 560;
const PLAYER_BODY_WIDTH = 48;
const PLAYER_BODY_HEIGHT = 90;
const PLAYER_VISUAL_SIZE = 150;
const PLAYER_FEET_OFFSET = 4;

const BOAR_SPEED = 90;
const BOAR_VISUAL_SIZE = 100;

const PROGRESS_KEY = "jago57-adventure-progress";
const PLAYER_KEY = "jago57-player-name";
const LOCAL_LEADERBOARD_KEY = "jago57-local-leaderboard";
const SOUND_KEY = "jago57-sound-enabled";

const IS_TOUCH_DEVICE =
    ("ontouchstart" in window) ||
    navigator.maxTouchPoints > 0;


// =====================================================
// SUPABASE
// =====================================================

const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL;

const SUPABASE_KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;


const supabase =
    SUPABASE_URL &&
    SUPABASE_KEY

        ? createClient(
            SUPABASE_URL,
            SUPABASE_KEY,
            {
                auth: {
                    persistSession: false
                }
            }
        )

        : null;


let onlineStatus =
    "CHECKING";


// =====================================================
// SOUND
// =====================================================

let audioContext =
    null;


let soundEnabled =
    loadSoundEnabled();


// =====================================================
// LEVEL DATA
// =====================================================

const LEVELS = {

    "1-1": {

        name:
            "WORLD 1-1",

        subtitle:
            "GREEN VALLEY",

        worldWidth:
            5000,

        startX:
            150,

        startY:
            430,

        gaps: [

            [1500, 1660],

            [3300, 3460]

        ],

        checkpointX:
            2500,

        finishX:
            4750,

        platforms: [

            [520, 410, 260],

            [900, 345, 230],

            [1320, 395, 250],

            [1810, 390, 250],

            [2200, 330, 240],

            [2600, 390, 270],

            [3000, 330, 240],

            [3220, 405, 180],

            [3600, 390, 250],

            [4000, 325, 260],

            [4400, 390, 260]

        ],

        tokens: [

            [520, 345],

            [900, 280],

            [1150, 490],

            [1320, 330],

            [1580, 430],

            [1810, 325],

            [2200, 265],

            [2400, 490],

            [2600, 325],

            [3000, 265],

            [3380, 430],

            [3600, 325],

            [3850, 490],

            [4000, 260],

            [4400, 325]

        ],

        boars: [

            [1150, 510, 1000, 1320],

            [2850, 510, 2720, 3120],

            [4200, 510, 4050, 4500]

        ]

    },


    "1-2": {

        name:
            "WORLD 1-2",

        subtitle:
            "WILD RIDGE",

        worldWidth:
            5400,

        startX:
            150,

        startY:
            430,

        gaps: [

            [1100, 1280],

            [2500, 2680],

            [4000, 4200]

        ],

        checkpointX:
            2900,

        finishX:
            5150,

        platforms: [

            [480, 410, 240],

            [800, 350, 220],

            [1040, 410, 150],

            [1400, 390, 240],

            [1750, 320, 220],

            [2150, 400, 260],

            [2420, 355, 150],

            [2820, 410, 220],

            [3150, 340, 250],

            [3500, 400, 240],

            [3850, 330, 230],

            [4300, 410, 250],

            [4650, 340, 230],

            [4950, 400, 220]

        ],

        tokens: [

            [480, 345],

            [800, 285],

            [1180, 430],

            [1400, 325],

            [1750, 255],

            [2150, 335],

            [2550, 430],

            [2820, 345],

            [3150, 275],

            [3500, 335],

            [3850, 265],

            [4100, 430],

            [4300, 345],

            [4650, 275],

            [4950, 335]

        ],

        boars: [

            [700, 510, 600, 1000],

            [1600, 510, 1400, 2050],

            [3250, 510, 3050, 3800],

            [4550, 510, 4300, 4950]

        ]

    }

};


// =====================================================
// LOCAL SAVE
// =====================================================

function defaultProgress() {

    return {

        world11:
            true,

        world12:
            false

    };

}


function loadProgress() {

    try {

        return {

            ...defaultProgress(),

            ...JSON.parse(
                localStorage.getItem(
                    PROGRESS_KEY
                ) || "{}"
            )

        };

    }

    catch {

        return defaultProgress();

    }

}


function saveProgress(
    progress
) {

    try {

        localStorage.setItem(
            PROGRESS_KEY,
            JSON.stringify(
                progress
            )
        );

    }

    catch {}

}


function getPlayerName() {

    try {

        return (
            localStorage.getItem(
                PLAYER_KEY
            ) || ""
        ).trim();

    }

    catch {

        return "";

    }

}


function savePlayerName(
    name
) {

    const clean =
        String(
            name || ""
        )
            .trim()
            .replace(
                /\s+/g,
                " "
            )
            .slice(
                0,
                12
            )
            .toUpperCase();


    try {

        localStorage.setItem(
            PLAYER_KEY,
            clean
        );

    }

    catch {}


    return clean;

}


// =====================================================
// LOCAL LEADERBOARD
// =====================================================

function loadLocalLeaderboard() {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(
                    LOCAL_LEADERBOARD_KEY
                ) || "[]"
            );


        return Array.isArray(
            data
        )
            ? data
            : [];

    }

    catch {

        return [];

    }

}


function saveLocalLeaderboard(
    data
) {

    try {

        localStorage.setItem(
            LOCAL_LEADERBOARD_KEY,
            JSON.stringify(
                data
            )
        );

    }

    catch {}

}


function submitLocalScore(
    name,
    score,
    levelId
) {

    const player =
        String(
            name ||
            "PLAYER"
        )
            .trim()
            .slice(
                0,
                12
            )
            .toUpperCase();


    const leaderboard =
        loadLocalLeaderboard();


    const existing =
        leaderboard.find(
            item =>
                String(
                    item.name ||
                    ""
                )
                    .toUpperCase() ===
                player
        );


    if (
        existing
    ) {

        if (
            score >
            Number(
                existing.score ||
                0
            )
        ) {

            existing.score =
                score;


            existing.levelId =
                levelId;

        }

    }

    else {

        leaderboard.push({

            name:
                player,

            score:
                score,

            levelId:
                levelId

        });

    }


    leaderboard.sort(
        (
            a,
            b
        ) =>
            Number(
                b.score ||
                0
            ) -
            Number(
                a.score ||
                0
            )
    );


    const top10 =
        leaderboard.slice(
            0,
            10
        );


    saveLocalLeaderboard(
        top10
    );


    return top10;

}


function getLocalBestScore(
    name
) {

    const target =
        String(
            name ||
            ""
        )
            .toUpperCase();


    const entry =
        loadLocalLeaderboard()
            .find(
                item =>
                    String(
                        item.name ||
                        ""
                    )
                        .toUpperCase() ===
                    target
            );


    return entry
        ? Number(
            entry.score ||
            0
        )
        : 0;

}


// =====================================================
// SOUND SAVE
// =====================================================

function loadSoundEnabled() {

    try {

        const saved =
            localStorage.getItem(
                SOUND_KEY
            );


        return saved === null
            ? true
            : saved === "true";

    }

    catch {

        return true;

    }

}


function saveSoundEnabled() {

    try {

        localStorage.setItem(
            SOUND_KEY,
            String(
                soundEnabled
            )
        );

    }

    catch {}

}


// =====================================================
// SUPABASE CONNECTION
// =====================================================

async function testOnlineConnection() {

    if (
        !supabase
    ) {

        onlineStatus =
            "OFFLINE";


        return false;

    }


    try {

        const {
            error
        } =
            await supabase
                .from(
                    "leaderboard"
                )
                .select(
                    "id"
                )
                .limit(
                    1
                );


        if (
            error
        ) {

            throw error;

        }


        onlineStatus =
            "ONLINE";


        return true;

    }

    catch (
        error
    ) {

        console.error(
            "Supabase connection error:",
            error
        );


        onlineStatus =
            "OFFLINE";


        return false;

    }

}


// =====================================================
// ONLINE SCORE
// =====================================================

async function submitOnlineScore(
    playerName,
    score,
    levelId
) {

    if (
        !supabase
    ) {

        return false;

    }


    try {

        const cleanName =
            String(
                playerName ||
                "PLAYER"
            )
                .trim()
                .slice(
                    0,
                    12
                )
                .toUpperCase();


        const cleanScore =
            Math.max(
                0,
                Math.floor(
                    Number(
                        score
                    ) || 0
                )
            );


        const {
            error
        } =
            await supabase
                .from(
                    "leaderboard"
                )
                .insert({

                    player_name:
                        cleanName,

                    score:
                        cleanScore,

                    level_id:
                        levelId

                });


        if (
            error
        ) {

            throw error;

        }


        onlineStatus =
            "ONLINE";


        return true;

    }

    catch (
        error
    ) {

        console.error(
            "Online score insert error:",
            error
        );


        onlineStatus =
            "OFFLINE";


        return false;

    }

}


// =====================================================
// ONLINE BEST SCORE
// =====================================================

async function getOnlineBestScore(
    playerName
) {

    if (
        !supabase
    ) {

        return null;

    }


    try {

        const cleanName =
            String(
                playerName ||
                "PLAYER"
            )
                .trim()
                .slice(
                    0,
                    12
                )
                .toUpperCase();


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "leaderboard"
                )
                .select(
                    "score"
                )
                .eq(
                    "player_name",
                    cleanName
                )
                .order(
                    "score",
                    {
                        ascending:
                            false
                    }
                )
                .limit(
                    1
                );


        if (
            error
        ) {

            throw error;

        }


        onlineStatus =
            "ONLINE";


        return data?.length
            ? Number(
                data[0].score ||
                0
            )
            : 0;

    }

    catch (
        error
    ) {

        console.error(
            "Best score fetch error:",
            error
        );


        onlineStatus =
            "OFFLINE";


        return null;

    }

}


// =====================================================
// GLOBAL LEADERBOARD
// =====================================================

async function getOnlineLeaderboard() {

    if (
        !supabase
    ) {

        return null;

    }


    try {

        const {
            data,
            error
        } =
            await supabase
                .from(
                    "leaderboard"
                )
                .select(
                    "player_name, score, level_id, created_at"
                )
                .order(
                    "score",
                    {
                        ascending:
                            false
                    }
                )
                .limit(
                    100
                );


        if (
            error
        ) {

            throw error;

        }


        onlineStatus =
            "ONLINE";


        // Nama yang sama hanya muncul satu kali.
        // Yang dipakai adalah skor tertinggi.

        const unique =
            new Map();


        for (
            const row of
            data || []
        ) {

            const name =
                String(
                    row.player_name ||
                    "PLAYER"
                )
                    .trim()
                    .toUpperCase();


            const score =
                Number(
                    row.score ||
                    0
                );


            const current =
                unique.get(
                    name
                );


            if (
                !current ||
                score >
                current.score
            ) {

                unique.set(
                    name,
                    {

                        name,

                        score,

                        levelId:
                            row.level_id

                    }
                );

            }

        }


        return Array
            .from(
                unique.values()
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.score -
                    a.score
            )
            .slice(
                0,
                10
            );

    }

    catch (
        error
    ) {

        console.error(
            "Online leaderboard error:",
            error
        );


        onlineStatus =
            "OFFLINE";


        return null;

    }

}


// =====================================================
// WEB AUDIO
// =====================================================

function unlockAudio() {

    if (
        !soundEnabled
    ) {

        return;

    }


    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;


    if (
        !AudioContextClass
    ) {

        return;

    }


    if (
        !audioContext
    ) {

        audioContext =
            new AudioContextClass();

    }


    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();

    }

}


function playTone(
    startFrequency,
    duration = 0.1,
    type = "sine",
    volume = 0.04,
    endFrequency = null,
    delay = 0
) {

    if (
        !soundEnabled
    ) {

        return;

    }


    unlockAudio();


    if (
        !audioContext
    ) {

        return;

    }


    const now =
        audioContext.currentTime +
        delay;


    const oscillator =
        audioContext.createOscillator();


    const gain =
        audioContext.createGain();


    oscillator.type =
        type;


    oscillator.frequency
        .setValueAtTime(
            startFrequency,
            now
        );


    if (
        endFrequency !== null
    ) {

        oscillator.frequency
            .exponentialRampToValueAtTime(
                Math.max(
                    1,
                    endFrequency
                ),
                now +
                duration
            );

    }


    gain.gain
        .setValueAtTime(
            0.0001,
            now
        );


    gain.gain
        .exponentialRampToValueAtTime(
            Math.max(
                0.0001,
                volume
            ),
            now +
            0.015
        );


    gain.gain
        .exponentialRampToValueAtTime(
            0.0001,
            now +
            duration
        );


    oscillator.connect(
        gain
    );


    gain.connect(
        audioContext.destination
    );


    oscillator.start(
        now
    );


    oscillator.stop(
        now +
        duration +
        0.03
    );

}


// =====================================================
// SOUND EFFECTS
// =====================================================

const SFX = {

    button() {

        playTone(
            380,
            0.06,
            "square",
            0.025,
            520
        );

    },


    jump() {

        playTone(
            330,
            0.11,
            "square",
            0.03,
            650
        );

    },


    token() {

        playTone(
            720,
            0.08,
            "sine",
            0.04,
            950
        );


        playTone(
            980,
            0.09,
            "sine",
            0.035,
            1250,
            0.07
        );

    },


    stomp() {

        playTone(
            190,
            0.11,
            "square",
            0.05,
            95
        );

    },


    hit() {

        playTone(
            210,
            0.2,
            "sawtooth",
            0.045,
            75
        );

    },


    checkpoint() {

        playTone(
            440,
            0.12,
            "sine",
            0.04,
            550
        );


        playTone(
            660,
            0.15,
            "sine",
            0.045,
            880,
            0.16
        );

    },


    finish() {

        playTone(
            440,
            0.13,
            "triangle",
            0.04,
            550
        );


        playTone(
            550,
            0.13,
            "triangle",
            0.04,
            660,
            0.12
        );


        playTone(
            660,
            0.13,
            "triangle",
            0.04,
            880,
            0.24
        );


        playTone(
            880,
            0.3,
            "triangle",
            0.05,
            1100,
            0.36
        );

    }

};


// =====================================================
// BUTTON HELPER
// =====================================================

function createButton(
    scene,
    x,
    y,
    width,
    height,
    label,
    callback,
    options = {}
) {

    const depth =
        options.depth ??
        10;


    const box =
        scene.add.rectangle(
            x,
            y,
            width,
            height,
            options.color ??
            0x4b9b44
        )
        .setStrokeStyle(
            4,
            options.stroke ??
            0x276029
        )
        .setDepth(
            depth
        )
        .setInteractive({
            useHandCursor:
                true
        });


    const text =
        scene.add.text(
            x,
            y,
            label,
            {

                fontFamily:
                    "Arial",

                fontSize:
                    options.fontSize ??
                    "21px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"

            }
        )
        .setOrigin(
            0.5
        )
        .setDepth(
            depth +
            1
        )
        .setInteractive({
            useHandCursor:
                true
        });


    if (
        options.fixed
    ) {

        box.setScrollFactor(
            0
        );


        text.setScrollFactor(
            0
        );

    }


    const run =
        () => {

            SFX.button();

            callback();

        };


    box.on(
        "pointerdown",
        run
    );


    text.on(
        "pointerdown",
        run
    );


    box.on(
        "pointerover",
        () => {

            box.setScale(
                1.04
            );

        }
    );


    box.on(
        "pointerout",
        () => {

            box.setScale(
                1
            );

        }
    );


    return [
        box,
        text
    ];

}


// =====================================================
// BOOT
// =====================================================

class BootScene extends Phaser.Scene {

    constructor() {

        super(
            "BootScene"
        );

    }


    preload() {

        this.load.image(
            "jago-idle",
            "/assets/character/jago-idle.png"
        );


        for (
            let i = 1;
            i <= 6;
            i++
        ) {

            this.load.image(
                `jago-run-${i}`,
                `/assets/character/jago-run-${i}.png`
            );

        }


        this.load.image(
            "boar-idle",
            "/assets/enemies/boar-idle.png"
        );


        for (
            let i = 1;
            i <= 4;
            i++
        ) {

            this.load.image(
                `boar-walk-${i}`,
                `/assets/enemies/boar-walk-${i}.png`
            );

        }

    }


    create() {

        this.anims.create({

            key:
                "jago-run",

            frames: [

                1,
                2,
                3,
                4,
                5,
                6

            ].map(
                i => ({

                    key:
                        `jago-run-${i}`

                })
            ),

            frameRate:
                10,

            repeat:
                -1

        });


        this.anims.create({

            key:
                "boar-walk",

            frames: [

                1,
                2,
                3,
                4

            ].map(
                i => ({

                    key:
                        `boar-walk-${i}`

                })
            ),

            frameRate:
                7,

            repeat:
                -1

        });


        this.scene.start(

            getPlayerName()

                ? "MenuScene"

                : "NameScene"

        );

    }

}


// =====================================================
// NAME
// =====================================================

class NameScene extends Phaser.Scene {

    constructor() {

        super(
            "NameScene"
        );

    }


    init(
        data
    ) {

        this.editing =
            Boolean(
                data?.editing
            );

    }


    create() {

        this.typedName =
            this.editing

                ? getPlayerName()

                : "";


        this.add.rectangle(
            500,
            300,
            1000,
            600,
            0x75c8ec
        );


        this.add.circle(
            820,
            105,
            55,
            0xffd54f
        );


        this.add.rectangle(
            500,
            565,
            1000,
            70,
            0x3d873d
        );


        this.add.rectangle(
            500,
            532,
            1000,
            10,
            0x55a84f
        );


        this.add.sprite(
            175,
            525,
            "jago-idle"
        )
        .setOrigin(
            0.5,
            1
        )
        .setDisplaySize(
            230,
            230
        );


        this.add.sprite(
            825,
            525,
            "boar-idle"
        )
        .setOrigin(
            0.5,
            1
        )
        .setDisplaySize(
            155,
            155
        )
        .setFlipX(
            true
        );


        this.add.rectangle(
            500,
            300,
            540,
            390,
            0x07111f,
            0.88
        )
        .setStrokeStyle(
            4,
            0x26384a
        );


        this.add.text(
            500,
            140,

            this.editing

                ? "UBAH NAMA PEMAIN"

                : "WELCOME",

            {

                fontFamily:
                    "Arial",

                fontSize:
                    "38px",

                fontStyle:
                    "bold",

                color:
                    "#FFD166"

            }
        )
        .setOrigin(
            0.5
        );


        this.add.text(
            500,
            190,
            "JAGO57 ADVENTURE",
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "23px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"

            }
        )
        .setOrigin(
            0.5
        );


        this.add.text(
            500,
            235,
            "Ketik nama pemain (maks. 12 karakter)",
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "16px",

                color:
                    "#ffffff"

            }
        )
        .setOrigin(
            0.5
        );


        this.add.rectangle(
            500,
            305,
            360,
            60,
            0xffffff,
            0.12
        )
        .setStrokeStyle(
            3,
            0xffd166
        );


        this.nameText =
            this.add.text(
                500,
                305,

                this.typedName ||
                "_",

                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "27px",

                    fontStyle:
                        "bold",

                    color:
                        "#ffffff"

                }
            )
            .setOrigin(
                0.5
            );


        this.errorText =
            this.add.text(
                500,
                350,
                "",
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "14px",

                    color:
                        "#ffaaaa"

                }
            )
            .setOrigin(
                0.5
            );


        createButton(
            this,
            500,
            420,
            260,
            58,
            "START ADVENTURE",
            () => {

                this.submitName();

            }
        );


        if (
            this.editing
        ) {

            createButton(
                this,
                500,
                490,
                210,
                44,
                "BATAL",
                () => {

                    this.scene.start(
                        "MenuScene"
                    );

                },
                {

                    color:
                        0x986128,

                    stroke:
                        0x623d18,

                    fontSize:
                        "16px"

                }
            );

        }


        this.input.keyboard.on(
            "keydown",
            event => {

                unlockAudio();


                if (
                    event.key ===
                    "Enter"
                ) {

                    this.submitName();

                    return;

                }


                if (
                    event.key ===
                    "Backspace"
                ) {

                    this.typedName =
                        this.typedName.slice(
                            0,
                            -1
                        );


                    this.refreshName();

                    return;

                }


                if (
                    this.typedName.length >=
                    12
                ) {

                    return;

                }


                if (
                    /^[a-zA-Z0-9 _.-]$/.test(
                        event.key
                    )
                ) {

                    this.typedName +=
                        event.key.toUpperCase();


                    this.refreshName();

                }

            }
        );

    }


    refreshName() {

        this.nameText.setText(

            this.typedName ||
            "_"

        );


        this.errorText.setText(
            ""
        );

    }


    submitName() {

        const clean =
            savePlayerName(
                this.typedName
            );


        if (
            !clean
        ) {

            this.errorText.setText(
                "Nama pemain tidak boleh kosong."
            );


            return;

        }


        this.scene.start(
            "MenuScene"
        );

    }

}


// =====================================================
// MENU
// =====================================================

class MenuScene extends Phaser.Scene {

    constructor() {

        super(
            "MenuScene"
        );

    }


    create() {

        this.playerName =
            getPlayerName() ||
            "PLAYER";


        this.localBest =
            getLocalBestScore(
                this.playerName
            );


        this.add.rectangle(
            500,
            300,
            1000,
            600,
            0x75c8ec
        );


        this.add.circle(
            820,
            105,
            55,
            0xffd54f
        );


        this.add.triangle(
            150,
            525,
            0, 220,
            180, 0,
            360, 220,
            0x6c9f76
        );


        this.add.triangle(
            500,
            525,
            0, 290,
            220, 0,
            440, 290,
            0x5f9270
        );


        this.add.triangle(
            800,
            525,
            0, 230,
            190, 0,
            380, 230,
            0x6c9f76
        );


        this.add.rectangle(
            500,
            565,
            1000,
            70,
            0x3d873d
        );


        this.add.rectangle(
            500,
            532,
            1000,
            10,
            0x55a84f
        );


        this.add.sprite(
            165,
            525,
            "jago-idle"
        )
        .setOrigin(
            0.5,
            1
        )
        .setDisplaySize(
            220,
            220
        );


        this.add.sprite(
            840,
            525,
            "boar-idle"
        )
        .setOrigin(
            0.5,
            1
        )
        .setDisplaySize(
            150,
            150
        )
        .setFlipX(
            true
        );


        this.add.rectangle(
            500,
            315,
            420,
            470,
            0x07111f,
            0.28
        );


        this.add.text(
            500,
            55,
            "JAGO57",
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "72px",

                fontStyle:
                    "bold",

                color:
                    "#FFD166",

                stroke:
                    "#07111f",

                strokeThickness:
                    8

            }
        )
        .setOrigin(
            0.5
        );


        this.add.text(
            500,
            120,
            "ADVENTURE",
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "33px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff",

                stroke:
                    "#07111f",

                strokeThickness:
                    5

            }
        )
        .setOrigin(
            0.5
        );


        this.bestText =
            this.add.text(
                500,
                158,

                `PLAYER: ${this.playerName} • BEST LOCAL: ${this.localBest}`,

                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "15px",

                    fontStyle:
                        "bold",

                    color:
                        "#ffffff"

                }
            )
            .setOrigin(
                0.5
            );


        this.connectionText =
            this.add.text(
                500,
                185,
                "● CHECKING ONLINE...",
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "13px",

                    fontStyle:
                        "bold",

                    color:
                        "#FFD166"

                }
            )
            .setOrigin(
                0.5
            );


        createButton(
            this,
            500,
            240,
            300,
            54,
            "▶ PLAY",
            () => {

                this.scene.start(
                    "GameScene",
                    {
                        levelId:
                            "1-1"
                    }
                );

            },
            {

                fontSize:
                    "23px"

            }
        );


        createButton(
            this,
            500,
            305,
            300,
            50,
            "LEVEL SELECT",
            () => {

                this.scene.start(
                    "LevelSelectScene"
                );

            },
            {

                color:
                    0x986128,

                stroke:
                    0x623d18,

                fontSize:
                    "17px"

            }
        );


        createButton(
            this,
            500,
            365,
            300,
            50,
            "🏆 LEADERBOARD",
            () => {

                this.scene.start(
                    "LeaderboardScene"
                );

            },
            {

                color:
                    0x986128,

                stroke:
                    0x623d18,

                fontSize:
                    "17px"

            }
        );


        createButton(
            this,
            500,
            425,
            300,
            50,
            "HOW TO PLAY",
            () => {

                this.showHelp();

            },
            {

                color:
                    0x986128,

                stroke:
                    0x623d18,

                fontSize:
                    "17px"

            }
        );


        createButton(
            this,
            500,
            485,
            220,
            40,
            "UBAH NAMA",
            () => {

                this.scene.start(
                    "NameScene",
                    {
                        editing:
                            true
                    }
                );

            },
            {

                color:
                    0x3f4650,

                stroke:
                    0x262b31,

                fontSize:
                    "14px"

            }
        );


        // SOUND BUTTON MENU

        this.soundButton =
            this.add.text(
                885,
                24,

                soundEnabled

                    ? "🔊 SOUND ON"

                    : "🔇 SOUND OFF",

                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "13px",

                    fontStyle:
                        "bold",

                    color:
                        "#ffffff",

                    backgroundColor:
                        "#07111f",

                    padding: {
                        x: 9,
                        y: 6
                    }

                }
            )
            .setOrigin(
                0.5
            )
            .setInteractive({
                useHandCursor:
                    true
            });


        this.soundButton.on(
            "pointerdown",
            () => {

                soundEnabled =
                    !soundEnabled;


                saveSoundEnabled();


                this.soundButton.setText(

                    soundEnabled

                        ? "🔊 SOUND ON"

                        : "🔇 SOUND OFF"

                );


                if (
                    soundEnabled
                ) {

                    SFX.button();

                }

            }
        );


        this.refreshOnlineInfo();

    }


    async refreshOnlineInfo() {

        const connected =
            await testOnlineConnection();


        if (
            !this.scene.isActive(
                "MenuScene"
            )
        ) {

            return;

        }


        if (
            !connected
        ) {

            this.connectionText
                .setText(
                    "● LOCAL MODE"
                )
                .setColor(
                    "#FFD166"
                );


            this.bestText.setText(

                `PLAYER: ${this.playerName} • BEST LOCAL: ${this.localBest}`

            );


            return;

        }


        this.connectionText
            .setText(
                "● ONLINE LEADERBOARD"
            )
            .setColor(
                "#8cff9c"
            );


        const onlineBest =
            await getOnlineBestScore(
                this.playerName
            );


        if (
            !this.scene.isActive(
                "MenuScene"
            )
        ) {

            return;

        }


        if (
            onlineBest === null
        ) {

            this.bestText.setText(

                `PLAYER: ${this.playerName} • BEST LOCAL: ${this.localBest}`

            );

        }

        else {

            this.bestText.setText(

                `PLAYER: ${this.playerName} • BEST ONLINE: ${onlineBest}`

            );

        }

    }


    showHelp() {

        const objects =
            [];


        objects.push(

            this.add.rectangle(
                500,
                300,
                1000,
                600,
                0x07111f,
                0.96
            )
            .setDepth(
                500
            )

        );


        objects.push(

            this.add.text(
                500,
                90,
                "HOW TO PLAY",
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "38px",

                    fontStyle:
                        "bold",

                    color:
                        "#FFD166"

                }
            )
            .setOrigin(
                0.5
            )
            .setDepth(
                501
            )

        );


        objects.push(

            this.add.text(
                500,
                285,

                "← → Bergerak\n\n" +

                "SPACE / ↑ Melompat\n\n" +

                "Kumpulkan Token 57\n\n" +

                "Injak boar dari atas untuk +100 poin\n\n" +

                "Hindari boar dan jurang\n\n" +

                "P / ESC = Pause" +

                (
                    IS_TOUCH_DEVICE

                        ? "\n\nHP: gunakan tombol ◀ ▶ ▲"

                        : ""
                ),

                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "19px",

                    align:
                        "center",

                    color:
                        "#ffffff"

                }
            )
            .setOrigin(
                0.5
            )
            .setDepth(
                501
            )

        );


        let buttons =
            [];


        buttons =
            createButton(
                this,
                500,
                520,
                220,
                52,
                "KEMBALI",
                () => {

                    [
                        ...objects,
                        ...buttons
                    ]
                    .forEach(
                        item => {

                            if (
                                item &&
                                item.active
                            ) {

                                item.destroy();

                            }

                        }
                    );

                },
                {
                    depth:
                        502
                }
            );

    }

}


// =====================================================
// LEVEL SELECT
// =====================================================

class LevelSelectScene extends Phaser.Scene {

    constructor() {

        super(
            "LevelSelectScene"
        );

    }


    create() {

        const progress =
            loadProgress();


        this.add.rectangle(
            500,
            300,
            1000,
            600,
            0x07111f
        );


        this.add.text(
            500,
            70,
            "LEVEL SELECT",
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "45px",

                fontStyle:
                    "bold",

                color:
                    "#FFD166"

            }
        )
        .setOrigin(
            0.5
        );


        this.add.text(
            500,
            115,
            "Pilih dunia yang ingin dimainkan",
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "17px",

                color:
                    "#ffffff"

            }
        )
        .setOrigin(
            0.5
        );


        this.levelCard(
            300,
            285,
            "WORLD 1-1",
            "GREEN VALLEY",
            true,
            () => {

                this.scene.start(
                    "GameScene",
                    {
                        levelId:
                            "1-1"
                    }
                );

            }
        );


        this.levelCard(
            700,
            285,
            "WORLD 1-2",

            progress.world12

                ? "WILD RIDGE"

                : "LOCKED",

            progress.world12,

            () => {

                if (
                    progress.world12
                ) {

                    this.scene.start(
                        "GameScene",
                        {
                            levelId:
                                "1-2"
                        }
                    );

                }

                else {

                    this.locked();

                }

            }
        );


        createButton(
            this,
            500,
            500,
            220,
            55,
            "← MENU",
            () => {

                this.scene.start(
                    "MenuScene"
                );

            },
            {

                color:
                    0x986128,

                stroke:
                    0x623d18

            }
        );

    }


    levelCard(
        x,
        y,
        title,
        subtitle,
        unlocked,
        callback
    ) {

        const panel =
            this.add.rectangle(
                x,
                y,
                310,
                220,

                unlocked

                    ? 0x4b9b44

                    : 0x3f4650
            )
            .setStrokeStyle(
                5,

                unlocked

                    ? 0x276029

                    : 0x262b31
            )
            .setInteractive({
                useHandCursor:
                    true
            });


        this.add.text(
            x,
            y - 50,

            unlocked

                ? "✓"

                : "🔒",

            {

                fontFamily:
                    "Arial",

                fontSize:
                    "40px",

                color:
                    "#ffffff"

            }
        )
        .setOrigin(
            0.5
        );


        this.add.text(
            x,
            y + 15,
            title,
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "26px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"

            }
        )
        .setOrigin(
            0.5
        );


        this.add.text(
            x,
            y + 55,
            subtitle,
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "15px",

                color:
                    "#ffffff"

            }
        )
        .setOrigin(
            0.5
        );


        panel.on(
            "pointerdown",
            () => {

                SFX.button();

                callback();

            }
        );


        panel.on(
            "pointerover",
            () => {

                panel.setScale(
                    1.04
                );

            }
        );


        panel.on(
            "pointerout",
            () => {

                panel.setScale(
                    1
                );

            }
        );

    }


    locked() {

        const text =
            this.add.text(
                500,
                440,
                "Selesaikan WORLD 1-1 terlebih dahulu",
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "18px",

                    color:
                        "#FFD166"

                }
            )
            .setOrigin(
                0.5
            );


        this.time.delayedCall(
            1600,
            () => {

                text.destroy();

            }
        );

    }

}


// =====================================================
// LEADERBOARD
// =====================================================

class LeaderboardScene extends Phaser.Scene {

    constructor() {

        super(
            "LeaderboardScene"
        );

    }


    create() {

        this.add.rectangle(
            500,
            300,
            1000,
            600,
            0x07111f
        );


        this.add.text(
            500,
            55,
            "🏆 LEADERBOARD",
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "40px",

                fontStyle:
                    "bold",

                color:
                    "#FFD166"

            }
        )
        .setOrigin(
            0.5
        );


        this.statusText =
            this.add.text(
                500,
                100,
                "Mengambil leaderboard online...",
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "15px",

                    color:
                        "#ffffff"

                }
            )
            .setOrigin(
                0.5
            );


        this.boardObjects =
            [];


        createButton(
            this,
            380,
            545,
            210,
            48,
            "↻ REFRESH",
            () => {

                this.loadBoard();

            },
            {

                color:
                    0x4b9b44,

                stroke:
                    0x276029,

                fontSize:
                    "16px"

            }
        );


        createButton(
            this,
            620,
            545,
            210,
            48,
            "← MENU",
            () => {

                this.scene.start(
                    "MenuScene"
                );

            },
            {

                color:
                    0x986128,

                stroke:
                    0x623d18,

                fontSize:
                    "16px"

            }
        );


        this.loadBoard();

    }


    async loadBoard() {

        this.statusText
            .setText(
                "Mengambil leaderboard online..."
            )
            .setColor(
                "#ffffff"
            );


        this.clearBoard();


        const online =
            await getOnlineLeaderboard();


        if (
            !this.scene.isActive(
                "LeaderboardScene"
            )
        ) {

            return;

        }


        if (
            online
        ) {

            this.statusText
                .setText(
                    "● GLOBAL ONLINE • TOP 10"
                )
                .setColor(
                    "#8cff9c"
                );


            this.renderBoard(
                online
            );

        }

        else {

            this.statusText
                .setText(
                    "● OFFLINE • LOCAL LEADERBOARD"
                )
                .setColor(
                    "#FFD166"
                );


            this.renderBoard(
                loadLocalLeaderboard()
            );

        }

    }


    clearBoard() {

        this.boardObjects.forEach(
            object => {

                if (
                    object &&
                    object.active
                ) {

                    object.destroy();

                }

            }
        );


        this.boardObjects =
            [];

    }


    renderBoard(
        board
    ) {

        this.clearBoard();


        const panel =
            this.add.rectangle(
                500,
                325,
                620,
                365,
                0x162230,
                0.96
            )
            .setStrokeStyle(
                3,
                0x2f475e
            );


        this.boardObjects.push(
            panel
        );


        const headers = [

            this.add.text(
                250,
                155,
                "RANK",
                {
                    fontFamily:
                        "Arial",
                    fontSize:
                        "14px",
                    fontStyle:
                        "bold",
                    color:
                        "#9fb4c9"
                }
            ),

            this.add.text(
                325,
                155,
                "PLAYER",
                {
                    fontFamily:
                        "Arial",
                    fontSize:
                        "14px",
                    fontStyle:
                        "bold",
                    color:
                        "#9fb4c9"
                }
            ),

            this.add.text(
                570,
                155,
                "WORLD",
                {
                    fontFamily:
                        "Arial",
                    fontSize:
                        "14px",
                    fontStyle:
                        "bold",
                    color:
                        "#9fb4c9"
                }
            ),

            this.add.text(
                690,
                155,
                "SCORE",
                {
                    fontFamily:
                        "Arial",
                    fontSize:
                        "14px",
                    fontStyle:
                        "bold",
                    color:
                        "#9fb4c9"
                }
            )

        ];


        this.boardObjects.push(
            ...headers
        );


        if (
            !board.length
        ) {

            const empty =
                this.add.text(
                    500,
                    320,
                    "Belum ada skor.",
                    {

                        fontFamily:
                            "Arial",

                        fontSize:
                            "19px",

                        color:
                            "#ffffff"

                    }
                )
                .setOrigin(
                    0.5
                );


            this.boardObjects.push(
                empty
            );


            return;

        }


        const currentName =
            getPlayerName()
                .toUpperCase();


        board.forEach(
            (
                entry,
                index
            ) => {

                const y =
                    195 +
                    index *
                    31;


                const mine =
                    String(
                        entry.name ||
                        ""
                    )
                        .toUpperCase() ===
                    currentName;


                const color =
                    mine

                        ? "#FFD166"

                        : "#ffffff";


                const rank =
                    this.add.text(
                        270,
                        y,
                        `${index + 1}.`,
                        {

                            fontFamily:
                                "Arial",

                            fontSize:
                                "17px",

                            fontStyle:
                                "bold",

                            color

                        }
                    )
                    .setOrigin(
                        1,
                        0.5
                    );


                const name =
                    this.add.text(
                        325,
                        y,

                        entry.name ||
                        "PLAYER",

                        {

                            fontFamily:
                                "Arial",

                            fontSize:
                                "17px",

                            fontStyle:
                                mine
                                    ? "bold"
                                    : "normal",

                            color

                        }
                    )
                    .setOrigin(
                        0,
                        0.5
                    );


                const level =
                    this.add.text(
                        590,
                        y,

                        entry.levelId

                            ? `W ${entry.levelId}`

                            : "-",

                        {

                            fontFamily:
                                "Arial",

                            fontSize:
                                "14px",

                            color:
                                "#9fb4c9"

                        }
                    )
                    .setOrigin(
                        0.5
                    );


                const score =
                    this.add.text(
                        720,
                        y,

                        String(
                            entry.score ||
                            0
                        ),

                        {

                            fontFamily:
                                "Arial",

                            fontSize:
                                "17px",

                            fontStyle:
                                "bold",

                            color

                        }
                    )
                    .setOrigin(
                        1,
                        0.5
                    );


                this.boardObjects.push(
                    rank,
                    name,
                    level,
                    score
                );

            }
        );

    }

}


// =====================================================
// GAME
// =====================================================

class GameScene extends Phaser.Scene {

    constructor() {

        super(
            "GameScene"
        );

    }


    init(
        data
    ) {

        this.levelId =
            LEVELS[
                data?.levelId
            ]

                ? data.levelId

                : "1-1";


        this.level =
            LEVELS[
                this.levelId
            ];

    }


    create() {

        this.playerName =
            getPlayerName() ||
            "PLAYER";


        this.score =
            0;


        this.lives =
            3;


        this.checkpointX =
            this.level.startX;


        this.checkpointY =
            this.level.startY;


        this.checkpointActive =
            false;


        this.gameFinished =
            false;


        this.gameOverActive =
            false;


        this.respawning =
            false;


        this.invulnerable =
            false;


        this.facingLeft =
            false;


        this.isPaused =
            false;


        this.pauseObjects =
            [];


        this.enemies =
            [];


        this.mobileInput = {

            left:
                false,

            right:
                false,

            jump:
                false

        };


        if (
            IS_TOUCH_DEVICE
        ) {

            this.input.addPointer(
                2
            );

        }


        this.input.once(
            "pointerdown",
            unlockAudio
        );


        this.input.keyboard.once(
            "keydown",
            unlockAudio
        );


        // =================================================
        // WORLD
        // =================================================

        this.physics.world.setBounds(
            0,
            0,
            this.level.worldWidth,
            WORLD_HEIGHT
        );


        this.cameras.main.setBounds(
            0,
            0,
            this.level.worldWidth,
            GAME_HEIGHT
        );


        // BACKGROUND

        this.add.rectangle(
            this.level.worldWidth /
            2,
            300,
            this.level.worldWidth,
            600,

            this.levelId ===
            "1-2"

                ? 0x69b8df

                : 0x87CEEB
        );


        this.add.circle(
            800,
            105,
            52,
            0xffd54f
        );


        for (
            let x = 400;
            x <
            this.level.worldWidth;
            x += 750
        ) {

            this.cloud(
                x,
                110
            );

        }


        for (
            let x = 250;
            x <
            this.level.worldWidth;
            x += 650
        ) {

            this.add.triangle(
                x,
                525,

                0,
                260,

                190,
                0,

                380,
                260,

                this.levelId ===
                "1-2"

                    ? 0x5f8876

                    : 0x6fa36f
            );

        }


        const grounds =
            this.groundSegments();


        const platforms =
            this.level.platforms.map(
                platform =>
                    this.platform(
                        ...platform
                    )
            );


        // =================================================
        // PLAYER
        // =================================================

        this.playerBody =
            this.add.rectangle(
                this.level.startX,
                this.level.startY,
                PLAYER_BODY_WIDTH,
                PLAYER_BODY_HEIGHT,
                0xff0000,
                0
            );


        this.physics.add.existing(
            this.playerBody
        );


        this.playerBody.body
            .setCollideWorldBounds(
                true
            );


        this.playerSprite =
            this.add.sprite(
                this.level.startX,
                this.level.startY,
                "jago-idle"
            )
            .setOrigin(
                0.5,
                1
            )
            .setDisplaySize(
                PLAYER_VISUAL_SIZE,
                PLAYER_VISUAL_SIZE
            )
            .setDepth(
                20
            )
            .setAlpha(
                1
            );


        grounds.forEach(
            ground => {

                this.physics.add.collider(
                    this.playerBody,
                    ground
                );

            }
        );


        platforms.forEach(
            platform => {

                this.physics.add.collider(
                    this.playerBody,
                    platform
                );

            }
        );


        // INPUT

        this.cursors =
            this.input.keyboard
                .createCursorKeys();


        this.pauseKeyP =
            this.input.keyboard
                .addKey(
                    Phaser.Input.Keyboard
                        .KeyCodes.P
                );


        this.pauseKeyEsc =
            this.input.keyboard
                .addKey(
                    Phaser.Input.Keyboard
                        .KeyCodes.ESC
                );


        // OBJECTS

        this.level.tokens.forEach(
            token => {

                this.token(
                    ...token
                );

            }
        );


        this.level.boars.forEach(
            boar => {

                this.boar(
                    ...boar
                );

            }
        );


        this.checkpoint();

        this.finish();

        this.hud();

        this.syncPlayerVisual();


        this.input.on(
            "pointerup",
            () => {

                this.mobileInput.left =
                    false;


                this.mobileInput.right =
                    false;


                this.mobileInput.jump =
                    false;

            }
        );

    }


    // =================================================
    // EFFECT
    // =================================================

    burst(
        x,
        y,
        color,
        amount = 10
    ) {

        for (
            let i = 0;
            i < amount;
            i++
        ) {

            const p =
                this.add.circle(
                    x,
                    y,
                    Phaser.Math.Between(
                        3,
                        7
                    ),
                    color
                )
                .setDepth(
                    80
                );


            const angle =
                Phaser.Math.FloatBetween(
                    0,
                    Math.PI *
                    2
                );


            const distance =
                Phaser.Math.Between(
                    25,
                    70
                );


            this.tweens.add({

                targets:
                    p,

                x:
                    x +
                    Math.cos(
                        angle
                    ) *
                    distance,

                y:
                    y +
                    Math.sin(
                        angle
                    ) *
                    distance,

                alpha:
                    0,

                scale:
                    0.2,

                duration:
                    Phaser.Math.Between(
                        300,
                        550
                    ),

                onComplete:
                    () => {

                        p.destroy();

                    }

            });

        }

    }


    // =================================================
    // GROUND
    // =================================================

    groundSegments() {

        const grounds =
            [];


        let cursor =
            0;


        this.level.gaps.forEach(
            (
                [
                    start,
                    end
                ]
            ) => {

                if (
                    start >
                    cursor
                ) {

                    grounds.push(
                        this.ground(
                            cursor,
                            start
                        )
                    );

                }


                cursor =
                    end;

            }
        );


        if (
            cursor <
            this.level.worldWidth
        ) {

            grounds.push(
                this.ground(
                    cursor,
                    this.level.worldWidth
                )
            );

        }


        return grounds;

    }


    ground(
        start,
        end
    ) {

        const width =
            end -
            start;


        const center =
            start +
            width /
            2;


        const body =
            this.add.rectangle(
                center,
                565,
                width,
                70,
                0x3d873d
            );


        this.physics.add.existing(
            body,
            true
        );


        this.add.rectangle(
            center,
            532,
            width,
            10,
            0x55a84f
        );


        return body;

    }


    platform(
        x,
        y,
        width
    ) {

        const body =
            this.add.rectangle(
                x,
                y,
                width,
                30,
                0x986128
            );


        this.physics.add.existing(
            body,
            true
        );


        this.add.rectangle(
            x,
            y - 14,
            width,
            8,
            0x4b9b44
        );


        return body;

    }


    cloud(
        x,
        y
    ) {

        this.add.circle(
            x,
            y,
            35,
            0xffffff,
            0.85
        );


        this.add.circle(
            x + 40,
            y - 10,
            45,
            0xffffff,
            0.85
        );


        this.add.circle(
            x + 85,
            y,
            35,
            0xffffff,
            0.85
        );

    }


    // =================================================
    // TOKEN
    // =================================================

    token(
        x,
        y
    ) {

        const token =
            this.add.circle(
                x,
                y,
                23,
                0xffd700
            )
            .setStrokeStyle(
                4,
                0xd89a00
            );


        this.physics.add.existing(
            token,
            true
        );


        const text =
            this.add.text(
                x,
                y,
                "57",
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "15px",

                    fontStyle:
                        "bold",

                    color:
                        "#6b4600"

                }
            )
            .setOrigin(
                0.5
            );


        this.tweens.add({

            targets: [
                token,
                text
            ],

            y:
                y - 8,

            duration:
                700,

            yoyo:
                true,

            repeat:
                -1,

            ease:
                "Sine.easeInOut"

        });


        this.physics.add.overlap(
            this.playerBody,
            token,
            () => {

                if (
                    !token.active
                ) {

                    return;

                }


                SFX.token();


                this.burst(
                    token.x,
                    token.y,
                    0xffd700,
                    10
                );


                this.score +=
                    57;


                this.updateScore();


                token.destroy();

                text.destroy();

            }
        );

    }


    // =================================================
    // BOAR
    // =================================================

    boar(
        x,
        y,
        leftLimit,
        rightLimit
    ) {

        const body =
            this.add.rectangle(
                x,
                y,
                58,
                44,
                0xff0000,
                0
            );


        this.physics.add.existing(
            body
        );


        body.body.setAllowGravity(
            false
        );


        body.body.setImmovable(
            true
        );


        body.body.setVelocityX(
            BOAR_SPEED
        );


        const sprite =
            this.add.sprite(
                x,
                y,
                "boar-idle"
            )
            .setOrigin(
                0.5,
                1
            )
            .setDisplaySize(
                BOAR_VISUAL_SIZE,
                BOAR_VISUAL_SIZE
            )
            .setDepth(
                15
            );


        sprite.play(
            "boar-walk"
        );


        const enemy = {

            body,

            sprite,

            leftLimit,

            rightLimit,

            alive:
                true

        };


        this.enemies.push(
            enemy
        );


        this.physics.add.overlap(
            this.playerBody,
            body,
            () => {

                this.handleBoar(
                    enemy
                );

            }
        );

    }


    handleBoar(
        enemy
    ) {

        if (
            !enemy.alive ||

            this.respawning ||

            this.invulnerable ||

            this.gameFinished ||

            this.gameOverActive ||

            this.isPaused
        ) {

            return;

        }


        const falling =
            this.playerBody.body
                .velocity.y >
            80;


        const playerBottom =
            this.playerBody.body
                .bottom;


        const enemyTop =
            enemy.body.body
                .top;


        if (
            falling &&
            playerBottom <
            enemyTop +
            32
        ) {

            this.defeatBoar(
                enemy
            );


            this.playerBody.body
                .setVelocityY(
                    -330
                );


            return;

        }


        this.loseLife();

    }


    defeatBoar(
        enemy
    ) {

        if (
            !enemy.alive
        ) {

            return;

        }


        enemy.alive =
            false;


        enemy.body.body.enable =
            false;


        enemy.sprite.stop();


        SFX.stomp();


        this.cameras.main.shake(
            100,
            0.004
        );


        this.burst(
            enemy.sprite.x,
            enemy.sprite.y -
            30,
            0xff4545,
            12
        );


        this.burst(
            enemy.sprite.x,
            enemy.sprite.y -
            30,
            0xffd166,
            7
        );


        this.score +=
            100;


        this.updateScore();


        const bonus =
            this.add.text(
                enemy.sprite.x,
                enemy.sprite.y -
                80,
                "+100",
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "25px",

                    fontStyle:
                        "bold",

                    color:
                        "#FFD166",

                    stroke:
                        "#07111f",

                    strokeThickness:
                        4

                }
            )
            .setOrigin(
                0.5
            )
            .setDepth(
                90
            );


        this.tweens.add({

            targets:
                enemy.sprite,

            scaleY:
                0.25,

            alpha:
                0,

            duration:
                280,

            onComplete:
                () => {

                    enemy.body.destroy();

                    enemy.sprite.destroy();

                }

        });


        this.tweens.add({

            targets:
                bonus,

            y:
                bonus.y -
                50,

            alpha:
                0,

            duration:
                800,

            onComplete:
                () => {

                    bonus.destroy();

                }

        });

    }


    updateEnemies() {

        this.enemies.forEach(
            enemy => {

                if (
                    !enemy.alive ||

                    !enemy.body.active
                ) {

                    return;

                }


                if (
                    enemy.body.x <=
                    enemy.leftLimit
                ) {

                    enemy.body.body
                        .setVelocityX(
                            BOAR_SPEED
                        );


                    enemy.sprite
                        .setFlipX(
                            false
                        );

                }

                else if (
                    enemy.body.x >=
                    enemy.rightLimit
                ) {

                    enemy.body.body
                        .setVelocityX(
                            -BOAR_SPEED
                        );


                    enemy.sprite
                        .setFlipX(
                            true
                        );

                }


                enemy.sprite
                    .setPosition(
                        enemy.body.x,
                        enemy.body.body
                            .bottom +
                        3
                    )
                    .setDisplaySize(
                        BOAR_VISUAL_SIZE,
                        BOAR_VISUAL_SIZE
                    );

            }
        );

    }


    // =================================================
    // CHECKPOINT
    // =================================================

    checkpoint() {

        const x =
            this.level.checkpointX;


        this.add.rectangle(
            x,
            465,
            10,
            130,
            0xffffff
        );


        this.checkpointFlag =
            this.add.triangle(
                x + 40,
                405,

                0,
                0,

                80,
                30,

                0,
                60,

                0xffd700
            );


        this.add.text(
            x - 100,
            375,
            "CHECKPOINT",
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "18px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff",

                stroke:
                    "#07111f",

                strokeThickness:
                    3

            }
        );


        const zone =
            this.add.rectangle(
                x,
                440,
                120,
                190,
                0xffffff,
                0
            );


        this.physics.add.existing(
            zone,
            true
        );


        this.physics.add.overlap(
            this.playerBody,
            zone,
            () => {

                this.activateCheckpoint();

            }
        );

    }


    activateCheckpoint() {

        if (
            this.checkpointActive
        ) {

            return;

        }


        this.checkpointActive =
            true;


        this.checkpointX =
            this.level.checkpointX +
            50;


        this.checkpointY =
            430;


        this.checkpointFlag
            .setFillStyle(
                0x55c96b
            );


        this.checkpointStatusText
            .setText(
                "CHECKPOINT: AKTIF"
            );


        SFX.checkpoint();


        this.burst(
            this.level.checkpointX,
            420,
            0x55ff88,
            20
        );


        this.floating(
            "CHECKPOINT AKTIF!"
        );

    }


    // =================================================
    // FINISH
    // =================================================

    finish() {

        const x =
            this.level.finishX;


        const zone =
            this.add.rectangle(
                x,
                430,
                100,
                200,
                0xffffff,
                0
            );


        this.physics.add.existing(
            zone,
            true
        );


        this.add.rectangle(
            x,
            430,
            12,
            210,
            0xffffff
        );


        this.add.triangle(
            x + 50,
            345,

            0,
            0,

            100,
            35,

            0,
            70,

            0xffd700
        );


        this.add.text(
            x - 80,
            285,
            "FINISH",
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "26px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff",

                stroke:
                    "#07111f",

                strokeThickness:
                    4

            }
        );


        this.physics.add.overlap(
            this.playerBody,
            zone,
            () => {

                this.finishLevel();

            }
        );

    }


    // =================================================
    // HUD
    // =================================================

    hud() {

        this.add.rectangle(
            210,
            70,
            370,
            115,
            0x07111f,
            0.38
        )
        .setScrollFactor(
            0
        )
        .setDepth(
            95
        );


        this.add.rectangle(
            835,
            70,
            300,
            115,
            0x07111f,
            0.38
        )
        .setScrollFactor(
            0
        )
        .setDepth(
            95
        );


        this.add.text(
            35,
            17,
            "JAGO57",
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "35px",

                fontStyle:
                    "bold",

                color:
                    "#FFD166"

            }
        )
        .setScrollFactor(
            0
        )
        .setDepth(
            100
        );


        this.add.text(
            35,
            58,

            `${this.level.name} • ${this.level.subtitle}`,

            {

                fontFamily:
                    "Arial",

                fontSize:
                    "14px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"

            }
        )
        .setScrollFactor(
            0
        )
        .setDepth(
            100
        );


        this.add.text(
            35,
            91,

            IS_TOUCH_DEVICE

                ? "◀ ▶ GERAK   ▲ LOMPAT"

                : "← → GERAK   SPACE / ↑ LOMPAT   P = PAUSE",

            {

                fontFamily:
                    "Arial",

                fontSize:
                    "13px",

                color:
                    "#ffffff"

            }
        )
        .setScrollFactor(
            0
        )
        .setDepth(
            100
        );


        this.scoreText =
            this.add.text(
                705,
                20,
                "57 POINTS: 0",
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "20px",

                    fontStyle:
                        "bold",

                    color:
                        "#ffffff"

                }
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                100
            );


        this.livesText =
            this.add.text(
                705,
                52,
                "LIVES: ♥ ♥ ♥",
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "17px",

                    fontStyle:
                        "bold",

                    color:
                        "#ffffff"

                }
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                100
            );


        this.checkpointStatusText =
            this.add.text(
                705,
                82,
                "CHECKPOINT: START",
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "12px",

                    color:
                        "#ffffff"

                }
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                100
            );


        this.onlineHud =
            this.add.text(
                35,
                120,

                onlineStatus ===
                "ONLINE"

                    ? "● ONLINE"

                    : "● LOCAL MODE",

                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "12px",

                    fontStyle:
                        "bold",

                    color:
                        onlineStatus ===
                        "ONLINE"

                            ? "#8cff9c"

                            : "#FFD166",

                    backgroundColor:
                        "#07111f",

                    padding: {
                        x: 8,
                        y: 5
                    }

                }
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                160
            );


        // PAUSE

        this.pauseButton =
            this.add.text(
                780,
                120,
                "⏸ PAUSE",
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "14px",

                    fontStyle:
                        "bold",

                    color:
                        "#ffffff",

                    backgroundColor:
                        "#07111f",

                    padding: {
                        x: 9,
                        y: 6
                    }

                }
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                160
            )
            .setInteractive({
                useHandCursor:
                    true
            });


        this.pauseButton.on(
            "pointerdown",
            () => {

                SFX.button();

                this.togglePause();

            }
        );


        // SOUND

        this.soundButton =
            this.add.text(
                880,
                120,

                soundEnabled

                    ? "🔊 ON"

                    : "🔇 OFF",

                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "14px",

                    fontStyle:
                        "bold",

                    color:
                        "#ffffff",

                    backgroundColor:
                        "#07111f",

                    padding: {
                        x: 9,
                        y: 6
                    }

                }
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                160
            )
            .setInteractive({
                useHandCursor:
                    true
            });


        this.soundButton.on(
            "pointerdown",
            () => {

                soundEnabled =
                    !soundEnabled;


                saveSoundEnabled();


                this.soundButton.setText(

                    soundEnabled

                        ? "🔊 ON"

                        : "🔇 OFF"

                );


                if (
                    soundEnabled
                ) {

                    SFX.button();

                }

            }
        );


        if (
            IS_TOUCH_DEVICE
        ) {

            this.mobileControls();

        }

    }


    // =================================================
    // MOBILE CONTROLS
    // =================================================

    mobileControls() {

        const left =
            this.add.rectangle(
                75,
                520,
                82,
                68,
                0x07111f,
                0.68
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                150
            )
            .setInteractive();


        this.add.text(
            75,
            520,
            "◀",
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "32px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"

            }
        )
        .setOrigin(
            0.5
        )
        .setScrollFactor(
            0
        )
        .setDepth(
            151
        );


        const right =
            this.add.rectangle(
                175,
                520,
                82,
                68,
                0x07111f,
                0.68
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                150
            )
            .setInteractive();


        this.add.text(
            175,
            520,
            "▶",
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "32px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"

            }
        )
        .setOrigin(
            0.5
        )
        .setScrollFactor(
            0
        )
        .setDepth(
            151
        );


        const jump =
            this.add.circle(
                900,
                510,
                46,
                0x4b9b44,
                0.78
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                150
            )
            .setInteractive();


        this.add.text(
            900,
            510,
            "▲",
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "31px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"

            }
        )
        .setOrigin(
            0.5
        )
        .setScrollFactor(
            0
        )
        .setDepth(
            151
        );


        left.on(
            "pointerdown",
            () => {

                this.mobileInput.left =
                    true;

            }
        );


        left.on(
            "pointerup",
            () => {

                this.mobileInput.left =
                    false;

            }
        );


        left.on(
            "pointerout",
            () => {

                this.mobileInput.left =
                    false;

            }
        );


        right.on(
            "pointerdown",
            () => {

                this.mobileInput.right =
                    true;

            }
        );


        right.on(
            "pointerup",
            () => {

                this.mobileInput.right =
                    false;

            }
        );


        right.on(
            "pointerout",
            () => {

                this.mobileInput.right =
                    false;

            }
        );


        jump.on(
            "pointerdown",
            () => {

                this.mobileInput.jump =
                    true;

            }
        );


        jump.on(
            "pointerup",
            () => {

                this.mobileInput.jump =
                    false;

            }
        );

    }


    // =================================================
    // HUD UPDATE
    // =================================================

    updateScore() {

        this.scoreText.setText(

            `57 POINTS: ${this.score}`

        );

    }


    updateLives() {

        this.livesText.setText(

            `LIVES: ${"♥ ".repeat(
                this.lives
            )}`

        );

    }


    // =================================================
    // DAMAGE
    // =================================================

    loseLife() {

        if (
            this.respawning ||

            this.invulnerable ||

            this.gameFinished ||

            this.gameOverActive
        ) {

            return;

        }


        SFX.hit();


        this.cameras.main.shake(
            180,
            0.008
        );


        this.burst(
            this.playerSprite.x,
            this.playerSprite.y -
            55,
            0xff3333,
            14
        );


        this.lives--;


        this.updateLives();


        if (
            this.lives <=
            0
        ) {

            this.showGameOver();

            return;

        }


        this.respawnPlayer();

    }


    // =================================================
    // RESPAWN
    // =================================================

    respawnPlayer() {

        if (
            this.respawning
        ) {

            return;

        }


        this.respawning =
            true;


        this.invulnerable =
            true;


        this.mobileInput.left =
            false;


        this.mobileInput.right =
            false;


        this.mobileInput.jump =
            false;


        this.tweens.killTweensOf(
            this.playerSprite
        );


        this.playerSprite
            .setAlpha(
                0
            );


        this.playerBody.body.enable =
            false;


        const text =
            this.add.text(
                500,
                300,
                "RESPAWN...",
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "30px",

                    fontStyle:
                        "bold",

                    color:
                        "#ffffff",

                    backgroundColor:
                        "#07111f",

                    padding: {
                        x: 22,
                        y: 12
                    }

                }
            )
            .setOrigin(
                0.5
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                500
            );


        this.time.delayedCall(
            500,
            () => {

                this.playerBody.body.enable =
                    true;


                this.playerBody.body.reset(
                    this.checkpointX,
                    this.checkpointY
                );


                this.playerBody.body
                    .setVelocity(
                        0,
                        0
                    );


                this.tweens.killTweensOf(
                    this.playerSprite
                );


                this.playerSprite.stop();


                this.playerSprite
                    .setTexture(
                        "jago-idle"
                    )
                    .setAngle(
                        0
                    )
                    .setFlipX(
                        this.facingLeft
                    )
                    .setDisplaySize(
                        PLAYER_VISUAL_SIZE,
                        PLAYER_VISUAL_SIZE
                    )
                    .setAlpha(
                        1
                    );


                this.syncPlayerVisual();


                this.cameras.main.scrollX =
                    Phaser.Math.Clamp(
                        this.checkpointX -
                        350,
                        0,
                        this.level.worldWidth -
                        GAME_WIDTH
                    );


                text.destroy();


                this.respawning =
                    false;


                this.tweens.add({

                    targets:
                        this.playerSprite,

                    alpha: {
                        from:
                            0.35,

                        to:
                            1
                    },

                    duration:
                        120,

                    yoyo:
                        true,

                    repeat:
                        4,

                    onComplete:
                        () => {

                            this.playerSprite
                                .setAlpha(
                                    1
                                );


                            this.invulnerable =
                                false;

                        }

                });

            }
        );

    }


    // =================================================
    // PLAYER VISUAL
    // =================================================

    syncPlayerVisual() {

        if (
            !this.playerBody.body
        ) {

            return;

        }


        this.playerSprite
            .setPosition(
                this.playerBody.x,
                this.playerBody.body
                    .bottom +
                PLAYER_FEET_OFFSET
            )
            .setDisplaySize(
                PLAYER_VISUAL_SIZE,
                PLAYER_VISUAL_SIZE
            );

    }


    // =================================================
    // PAUSE
    // =================================================

    togglePause() {

        if (
            this.gameFinished ||

            this.gameOverActive ||

            this.respawning
        ) {

            return;

        }


        this.isPaused

            ? this.resumeGame()

            : this.pauseGame();

    }


    pauseGame() {

        if (
            this.isPaused
        ) {

            return;

        }


        this.isPaused =
            true;


        this.mobileInput.left =
            false;


        this.mobileInput.right =
            false;


        this.mobileInput.jump =
            false;


        this.physics.pause();


        this.playerSprite.anims
            ?.pause();


        this.enemies.forEach(
            enemy => {

                if (
                    enemy.alive &&
                    enemy.sprite?.anims
                ) {

                    enemy.sprite.anims
                        .pause();

                }

            }
        );


        const overlay =
            this.add.rectangle(
                500,
                300,
                1000,
                600,
                0x07111f,
                0.9
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                1000
            );


        const title =
            this.add.text(
                500,
                140,
                "PAUSED",
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "48px",

                    fontStyle:
                        "bold",

                    color:
                        "#FFD166"

                }
            )
            .setOrigin(
                0.5
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                1001
            );


        const resume =
            createButton(
                this,
                500,
                260,
                300,
                60,
                "▶ LANJUTKAN",
                () => {

                    this.resumeGame();

                },
                {

                    fixed:
                        true,

                    depth:
                        1002

                }
            );


        const restart =
            createButton(
                this,
                500,
                340,
                300,
                60,
                "↻ ULANGI LEVEL",
                () => {

                    this.physics.resume();


                    this.scene.restart({
                        levelId:
                            this.levelId
                    });

                },
                {

                    fixed:
                        true,

                    depth:
                        1002,

                    color:
                        0x986128,

                    stroke:
                        0x623d18

                }
            );


        const menu =
            createButton(
                this,
                500,
                420,
                300,
                60,
                "⌂ KEMBALI KE MENU",
                () => {

                    this.physics.resume();


                    this.scene.start(
                        "MenuScene"
                    );

                },
                {

                    fixed:
                        true,

                    depth:
                        1002,

                    color:
                        0x986128,

                    stroke:
                        0x623d18

                }
            );


        this.pauseObjects = [

            overlay,

            title,

            ...resume,

            ...restart,

            ...menu

        ];

    }


    resumeGame() {

        if (
            !this.isPaused
        ) {

            return;

        }


        this.isPaused =
            false;


        this.physics.resume();


        this.playerSprite.anims
            ?.resume();


        this.enemies.forEach(
            enemy => {

                if (
                    enemy.alive &&
                    enemy.sprite?.anims
                ) {

                    enemy.sprite.anims
                        .resume();

                }

            }
        );


        this.pauseObjects.forEach(
            object => {

                if (
                    object &&
                    object.active
                ) {

                    object.destroy();

                }

            }
        );


        this.pauseObjects =
            [];

    }


    // =================================================
    // MESSAGE
    // =================================================

    floating(
        message
    ) {

        const text =
            this.add.text(
                500,
                165,
                message,
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "27px",

                    fontStyle:
                        "bold",

                    color:
                        "#FFD166",

                    backgroundColor:
                        "#07111f",

                    padding: {
                        x: 18,
                        y: 10
                    }

                }
            )
            .setOrigin(
                0.5
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                400
            );


        this.tweens.add({

            targets:
                text,

            y:
                130,

            alpha:
                0,

            duration:
                1300,

            onComplete:
                () => {

                    text.destroy();

                }

        });

    }


    stopEnemies() {

        this.enemies.forEach(
            enemy => {

                if (
                    enemy.alive &&
                    enemy.body?.body
                ) {

                    enemy.body.body
                        .setVelocityX(
                            0
                        );

                }

            }
        );

    }


    // =================================================
    // GAME OVER
    // =================================================

    showGameOver() {

        if (
            this.gameOverActive
        ) {

            return;

        }


        this.gameOverActive =
            true;


        this.tweens.killTweensOf(
            this.playerSprite
        );


        this.playerSprite
            .setAlpha(
                1
            );


        this.playerBody.body.enable =
            false;


        this.stopEnemies();


        this.resultPanel(
            "GAME OVER",
            false,
            false
        );

    }


    // =================================================
    // FINISH
    // =================================================

    async finishLevel() {

        if (
            this.gameFinished
        ) {

            return;

        }


        this.gameFinished =
            true;


        this.tweens.killTweensOf(
            this.playerSprite
        );


        this.playerSprite
            .setAlpha(
                1
            );


        this.playerBody.body
            .setVelocity(
                0,
                0
            );


        this.stopEnemies();


        SFX.finish();


        this.cameras.main.shake(
            180,
            0.004
        );


        this.burst(
            this.playerSprite.x,
            this.playerSprite.y -
            80,
            0xffd700,
            22
        );


        this.burst(
            this.playerSprite.x,
            this.playerSprite.y -
            80,
            0x55ff88,
            15
        );


        this.burst(
            this.playerSprite.x,
            this.playerSprite.y -
            80,
            0xffffff,
            12
        );


        if (
            this.levelId ===
            "1-1"
        ) {

            const progress =
                loadProgress();


            progress.world12 =
                true;


            saveProgress(
                progress
            );

        }


        // Selalu simpan lokal.

        submitLocalScore(
            this.playerName,
            this.score,
            this.levelId
        );


        const savingText =
            this.add.text(
                500,
                300,
                "MENYIMPAN SKOR...",
                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "22px",

                    fontStyle:
                        "bold",

                    color:
                        "#ffffff",

                    backgroundColor:
                        "#07111f",

                    padding: {
                        x: 18,
                        y: 10
                    }

                }
            )
            .setOrigin(
                0.5
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                1050
            );


        const uploaded =
            await submitOnlineScore(
                this.playerName,
                this.score,
                this.levelId
            );


        if (
            savingText.active
        ) {

            savingText.destroy();

        }


        if (
            !this.scene.isActive(
                "GameScene"
            )
        ) {

            return;

        }


        this.resultPanel(
            `${this.level.name} COMPLETE!`,
            true,
            uploaded
        );

    }


    // =================================================
    // RESULT PANEL
    // =================================================

    resultPanel(
        title,
        completed,
        uploaded = false
    ) {

        this.add.rectangle(
            500,
            300,
            650,
            390,
            0x07111f,
            0.97
        )
        .setScrollFactor(
            0
        )
        .setDepth(
            1100
        );


        this.add.text(
            500,
            150,
            title,
            {

                fontFamily:
                    "Arial",

                fontSize:
                    "32px",

                fontStyle:
                    "bold",

                color:
                    "#FFD166"

            }
        )
        .setOrigin(
            0.5
        )
        .setScrollFactor(
            0
        )
        .setDepth(
            1101
        );


        this.add.text(
            500,
            205,

            `PLAYER: ${this.playerName}`,

            {

                fontFamily:
                    "Arial",

                fontSize:
                    "16px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"

            }
        )
        .setOrigin(
            0.5
        )
        .setScrollFactor(
            0
        )
        .setDepth(
            1101
        );


        this.add.text(
            500,
            245,

            `57 POINTS: ${this.score}`,

            {

                fontFamily:
                    "Arial",

                fontSize:
                    "24px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"

            }
        )
        .setOrigin(
            0.5
        )
        .setScrollFactor(
            0
        )
        .setDepth(
            1101
        );


        this.add.text(
            500,
            285,

            `SISA NYAWA: ${this.lives}`,

            {

                fontFamily:
                    "Arial",

                fontSize:
                    "18px",

                color:
                    "#ffffff"

            }
        )
        .setOrigin(
            0.5
        )
        .setScrollFactor(
            0
        )
        .setDepth(
            1101
        );


        if (
            completed
        ) {

            this.add.text(
                500,
                325,

                uploaded

                    ? "✓ SKOR TERSIMPAN ONLINE"

                    : "✓ SKOR TERSIMPAN LOKAL",

                {

                    fontFamily:
                        "Arial",

                    fontSize:
                        "16px",

                    fontStyle:
                        "bold",

                    color:
                        uploaded

                            ? "#8cff9c"

                            : "#FFD166"

                }
            )
            .setOrigin(
                0.5
            )
            .setScrollFactor(
                0
            )
            .setDepth(
                1101
            );

        }


        createButton(
            this,
            330,
            400,
            190,
            48,
            "ULANGI",
            () => {

                this.scene.restart({
                    levelId:
                        this.levelId
                });

            },
            {

                fixed:
                    true,

                depth:
                    1102,

                fontSize:
                    "16px"

            }
        );


        createButton(
            this,
            670,
            400,
            190,
            48,
            "LEADERBOARD",
            () => {

                this.scene.start(
                    "LeaderboardScene"
                );

            },
            {

                fixed:
                    true,

                depth:
                    1102,

                color:
                    0x986128,

                stroke:
                    0x623d18,

                fontSize:
                    "15px"

            }
        );


        // WORLD 1-1 selesai → langsung ke World 1-2

        if (
            completed &&
            this.levelId ===
            "1-1"
        ) {

            createButton(
                this,
                500,
                465,
                260,
                48,
                "LANJUT WORLD 1-2 ▶",
                () => {

                    this.scene.start(
                        "GameScene",
                        {
                            levelId:
                                "1-2"
                        }
                    );

                },
                {

                    fixed:
                        true,

                    depth:
                        1102,

                    fontSize:
                        "16px"

                }
            );

        }

        else {

            createButton(
                this,
                500,
                465,
                220,
                48,
                "LEVEL SELECT",
                () => {

                    this.scene.start(
                        "LevelSelectScene"
                    );

                },
                {

                    fixed:
                        true,

                    depth:
                        1102,

                    color:
                        0x3f4650,

                    stroke:
                        0x262b31,

                    fontSize:
                        "15px"

                }
            );

        }

    }


    // =================================================
    // UPDATE LOOP
    // =================================================

    update() {

        const pausePressed =

            Phaser.Input.Keyboard
                .JustDown(
                    this.pauseKeyP
                )

            ||

            Phaser.Input.Keyboard
                .JustDown(
                    this.pauseKeyEsc
                );


        if (
            pausePressed
        ) {

            SFX.button();

            this.togglePause();

        }


        if (
            this.isPaused
        ) {

            return;

        }


        this.updateEnemies();


        if (
            this.respawning ||

            this.gameOverActive ||

            this.gameFinished
        ) {

            return;

        }


        if (
            this.playerBody.y >
            700
        ) {

            this.loseLife();

            return;

        }


        this.playerBody.body
            .setVelocityX(
                0
            );


        const onGround =

            this.playerBody.body
                .blocked.down

            ||

            this.playerBody.body
                .touching.down;


        // LEFT

        if (
            this.cursors.left.isDown ||

            this.mobileInput.left
        ) {

            this.playerBody.body
                .setVelocityX(
                    -PLAYER_SPEED
                );


            this.facingLeft =
                true;


            this.playerSprite
                .setFlipX(
                    true
                );


            if (
                onGround
            ) {

                this.playerSprite
                    .play(
                        "jago-run",
                        true
                    );

            }

        }


        // RIGHT

        else if (
            this.cursors.right.isDown ||

            this.mobileInput.right
        ) {

            this.playerBody.body
                .setVelocityX(
                    PLAYER_SPEED
                );


            this.facingLeft =
                false;


            this.playerSprite
                .setFlipX(
                    false
                );


            if (
                onGround
            ) {

                this.playerSprite
                    .play(
                        "jago-run",
                        true
                    );

            }

        }


        // IDLE

        else if (
            onGround
        ) {

            this.playerSprite.stop();


            this.playerSprite
                .setTexture(
                    "jago-idle"
                )
                .setFlipX(
                    this.facingLeft
                );

        }


        // MOBILE JUMP ONE SHOT

        const mobileJumpPressed =
            this.mobileInput.jump;


        this.mobileInput.jump =
            false;


        const jumpPressed =

            Phaser.Input.Keyboard
                .JustDown(
                    this.cursors.up
                )

            ||

            Phaser.Input.Keyboard
                .JustDown(
                    this.cursors.space
                )

            ||

            mobileJumpPressed;


        if (
            jumpPressed &&
            onGround
        ) {

            SFX.jump();


            this.playerBody.body
                .setVelocityY(
                    -JUMP_POWER
                );

        }


        // AIR

        if (
            !onGround
        ) {

            this.playerSprite.stop();


            if (
                this.playerBody.body
                    .velocity.y <
                0
            ) {

                this.playerSprite
                    .setTexture(
                        "jago-run-4"
                    )
                    .setAngle(
                        this.facingLeft
                            ? -6
                            : 6
                    );

            }

            else {

                this.playerSprite
                    .setTexture(
                        "jago-run-5"
                    )
                    .setAngle(
                        this.facingLeft
                            ? 4
                            : -4
                    );

            }


            this.playerSprite
                .setFlipX(
                    this.facingLeft
                );

        }

        else {

            this.playerSprite
                .setAngle(
                    0
                );

        }


        // TRANSPARENCY SAFETY

        if (
            !this.invulnerable &&
            this.playerSprite.alpha !==
            1
        ) {

            this.playerSprite
                .setAlpha(
                    1
                );

        }


        this.syncPlayerVisual();


        // CAMERA

        const target =
            this.playerBody.x -
            350;


        const cameraX =
            Phaser.Math.Clamp(
                target,
                0,
                this.level.worldWidth -
                GAME_WIDTH
            );


        this.cameras.main.scrollX =
            Phaser.Math.Linear(
                this.cameras.main.scrollX,
                cameraX,
                0.15
            );

    }

}


// =====================================================
// CONFIG
// =====================================================

const gameConfig = {

    type:
        Phaser.AUTO,

    width:
        GAME_WIDTH,

    height:
        GAME_HEIGHT,

    parent:
        "game-container",

    backgroundColor:
        "#87CEEB",

    physics: {

        default:
            "arcade",

        arcade: {

            gravity: {
                y:
                    900
            },

            debug:
                false

        }

    },

    scene: [

        BootScene,

        NameScene,

        MenuScene,

        LevelSelectScene,

        LeaderboardScene,

        GameScene

    ]

};


new Phaser.Game(
    gameConfig
);