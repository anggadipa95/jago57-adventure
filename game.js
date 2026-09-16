import Phaser from "phaser";
import { createClient } from "@supabase/supabase-js";

// =====================================================
// JAGO57 ADVENTURE
// =====================================================

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
const BOSS_VISUAL_SIZE = 200;

const PROGRESS_KEY = "jago57-adventure-progress";
const PLAYER_KEY = "jago57-player-name";
const LOCAL_LEADERBOARD_KEY = "jago57-local-leaderboard";
const SOUND_KEY = "jago57-sound-enabled";

const IS_TOUCH_DEVICE =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;

// =====================================================
// SUPABASE
// =====================================================

const SUPABASE_URL =
    import.meta.env.VITE_SUPABASE_URL;

const SUPABASE_KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase =
    SUPABASE_URL && SUPABASE_KEY
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

let onlineStatus = "CHECKING";

// =====================================================
// LOCAL SAVE
// =====================================================

function defaultProgress() {
    return {
        world11: true,
        world12: false,
        world13: false
    };
}

function loadProgress() {
    try {
        return {
            ...defaultProgress(),
            ...JSON.parse(
                localStorage.getItem(PROGRESS_KEY) || "{}"
            )
        };
    } catch {
        return defaultProgress();
    }
}

function saveProgress(progress) {
    try {
        localStorage.setItem(
            PROGRESS_KEY,
            JSON.stringify(progress)
        );
    } catch {}
}

function getPlayerName() {
    try {
        return (
            localStorage.getItem(PLAYER_KEY) || ""
        ).trim();
    } catch {
        return "";
    }
}

function savePlayerName(name) {
    const clean =
        String(name || "")
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 12)
            .toUpperCase();

    try {
        localStorage.setItem(
            PLAYER_KEY,
            clean
        );
    } catch {}

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

        return Array.isArray(data)
            ? data
            : [];
    } catch {
        return [];
    }
}

function saveLocalLeaderboard(data) {
    try {
        localStorage.setItem(
            LOCAL_LEADERBOARD_KEY,
            JSON.stringify(data)
        );
    } catch {}
}

function submitLocalScore(
    name,
    score,
    levelId
) {
    const player =
        String(name || "PLAYER")
            .trim()
            .slice(0, 12)
            .toUpperCase();

    const leaderboard =
        loadLocalLeaderboard();

    const existing =
        leaderboard.find(
            item =>
                String(item.name || "")
                    .toUpperCase() ===
                player
        );

    if (existing) {
        if (
            score >
            Number(existing.score || 0)
        ) {
            existing.score = score;
            existing.levelId = levelId;
        }
    } else {
        leaderboard.push({
            name: player,
            score,
            levelId
        });
    }

    leaderboard.sort(
        (a, b) =>
            Number(b.score || 0) -
            Number(a.score || 0)
    );

    const top10 =
        leaderboard.slice(0, 10);

    saveLocalLeaderboard(top10);

    return top10;
}

function getLocalBestScore(name) {
    const target =
        String(name || "")
            .toUpperCase();

    const entry =
        loadLocalLeaderboard().find(
            item =>
                String(item.name || "")
                    .toUpperCase() ===
                target
        );

    return entry
        ? Number(entry.score || 0)
        : 0;
}

// =====================================================
// SOUND
// =====================================================

function loadSoundEnabled() {
    try {
        const saved =
            localStorage.getItem(SOUND_KEY);

        return saved === null
            ? true
            : saved === "true";
    } catch {
        return true;
    }
}

function saveSoundEnabled() {
    try {
        localStorage.setItem(
            SOUND_KEY,
            String(soundEnabled)
        );
    } catch {}
}

let audioContext = null;
let soundEnabled = loadSoundEnabled();

function unlockAudio() {
    if (!soundEnabled) return;

    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
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
    if (!soundEnabled) return;

    unlockAudio();

    if (!audioContext) return;

    const now =
        audioContext.currentTime +
        delay;

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type = type;

    oscillator.frequency
        .setValueAtTime(
            startFrequency,
            now
        );

    if (endFrequency !== null) {
        oscillator.frequency
            .exponentialRampToValueAtTime(
                Math.max(
                    1,
                    endFrequency
                ),
                now + duration
            );
    }

    gain.gain.setValueAtTime(
        0.0001,
        now
    );

    gain.gain
        .exponentialRampToValueAtTime(
            Math.max(
                0.0001,
                volume
            ),
            now + 0.015
        );

    gain.gain
        .exponentialRampToValueAtTime(
            0.0001,
            now + duration
        );

    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );

    oscillator.start(now);

    oscillator.stop(
        now + duration + 0.03
    );
}

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

    bossHit() {
        playTone(
            150,
            0.12,
            "square",
            0.06,
            80
        );

        playTone(
            520,
            0.1,
            "triangle",
            0.03,
            750,
            0.05
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
// SUPABASE FUNCTIONS
// =====================================================

async function testOnlineConnection() {
    if (!supabase) {
        onlineStatus = "OFFLINE";
        return false;
    }

    try {
        const { error } =
            await supabase
                .from("leaderboard")
                .select("id")
                .limit(1);

        if (error) throw error;

        onlineStatus = "ONLINE";

        return true;
    } catch (error) {
        console.error(
            "Supabase connection:",
            error
        );

        onlineStatus = "OFFLINE";

        return false;
    }
}

async function submitOnlineScore(
    playerName,
    score,
    levelId
) {
    if (!supabase) return false;

    try {
        const cleanName =
            String(
                playerName || "PLAYER"
            )
                .trim()
                .slice(0, 12)
                .toUpperCase();

        const cleanScore =
            Math.max(
                0,
                Math.floor(
                    Number(score) || 0
                )
            );

        const { error } =
            await supabase
                .from("leaderboard")
                .insert({
                    player_name:
                        cleanName,

                    score:
                        cleanScore,

                    level_id:
                        levelId
                });

        if (error) throw error;

        onlineStatus = "ONLINE";

        return true;
    } catch (error) {
        console.error(
            "Score upload:",
            error
        );

        onlineStatus = "OFFLINE";

        return false;
    }
}

async function getOnlineBestScore(
    playerName
) {
    if (!supabase) return null;

    try {
        const cleanName =
            String(
                playerName || "PLAYER"
            )
                .trim()
                .slice(0, 12)
                .toUpperCase();

        const { data, error } =
            await supabase
                .from("leaderboard")
                .select("score")
                .eq(
                    "player_name",
                    cleanName
                )
                .order(
                    "score",
                    {
                        ascending: false
                    }
                )
                .limit(1);

        if (error) throw error;

        onlineStatus = "ONLINE";

        return data?.length
            ? Number(
                  data[0].score || 0
              )
            : 0;
    } catch (error) {
        console.error(
            "Best score:",
            error
        );

        onlineStatus = "OFFLINE";

        return null;
    }
}

async function getOnlineLeaderboard() {
    if (!supabase) return null;

    try {
        const { data, error } =
            await supabase
                .from("leaderboard")
                .select(
                    "player_name, score, level_id, created_at"
                )
                .order(
                    "score",
                    {
                        ascending: false
                    }
                )
                .limit(100);

        if (error) throw error;

        onlineStatus = "ONLINE";

        const unique =
            new Map();

        for (
            const row of data || []
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
                    row.score || 0
                );

            const current =
                unique.get(name);

            if (
                !current ||
                score > current.score
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
            .from(unique.values())
            .sort(
                (a, b) =>
                    b.score -
                    a.score
            )
            .slice(0, 10);
    } catch (error) {
        console.error(
            "Leaderboard:",
            error
        );

        onlineStatus = "OFFLINE";

        return null;
    }
}

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
    },

    "1-3": {
        name:
            "WORLD 1-3",

        subtitle:
            "BOAR FORTRESS",

        worldWidth:
            6500,

        startX:
            150,

        startY:
            430,

        gaps: [
            [1200, 1370],
            [2600, 2790],
            [4100, 4300]
        ],

        checkpointX:
            5000,

        finishX:
            6250,

        platforms: [
            [450, 405, 230],
            [780, 340, 220],
            [1050, 390, 190],
            [1480, 380, 240],
            [1820, 310, 220],
            [2200, 385, 260],
            [2480, 330, 170],
            [2920, 390, 230],
            [3260, 325, 240],
            [3600, 395, 250],
            [3950, 320, 220],
            [4470, 390, 260],
            [4780, 330, 220],
            [5200, 390, 220]
        ],

        tokens: [
            [450, 340],
            [780, 275],
            [1050, 325],
            [1290, 430],
            [1480, 315],
            [1820, 245],
            [2200, 320],
            [2700, 430],
            [2920, 325],
            [3260, 260],
            [3600, 330],
            [3950, 255],
            [4200, 430],
            [4470, 325],
            [4780, 265],
            [5100, 430]
        ],

        boars: [
            [800, 510, 650, 1100],
            [1750, 510, 1450, 2350],
            [3150, 510, 2900, 3800],
            [4600, 510, 4400, 4900]
        ],

        boss: {
            x: 5650,
            y: 485,
            left: 5400,
            right: 6000,
            hp: 5
        }
    }
};

// =====================================================
// BUTTON
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
        options.depth ?? 10;

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
        .setDepth(depth)
        .setInteractive({
            useHandCursor: true
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
        .setOrigin(0.5)
        .setDepth(depth + 1)
        .setInteractive({
            useHandCursor: true
        });

    if (options.fixed) {
        box.setScrollFactor(0);
        text.setScrollFactor(0);
    }

    const run = () => {
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
        super("BootScene");
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

            frames:
                [1, 2, 3, 4, 5, 6]
                    .map(
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

            frames:
                [1, 2, 3, 4]
                    .map(
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
        super("NameScene");
    }

    init(data) {
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

        this.add.sprite(
            175,
            525,
            "jago-idle"
        )
        .setOrigin(0.5, 1)
        .setDisplaySize(
            230,
            230
        );

        this.add.sprite(
            825,
            525,
            "boar-idle"
        )
        .setOrigin(0.5, 1)
        .setDisplaySize(
            155,
            155
        )
        .setFlipX(true);

        this.add.rectangle(
            500,
            300,
            540,
            400,
            0x07111f,
            0.9
        );

        this.add.text(
            500,
            130,
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
        .setOrigin(0.5);

        this.add.text(
            500,
            180,
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
        .setOrigin(0.5);

        this.add.text(
            500,
            220,
            IS_TOUCH_DEVICE
                ? "Tap kotak nama untuk mengetik"
                : "Ketik nama pemain (maks. 12 karakter)",
            {
                fontFamily:
                    "Arial",

                fontSize:
                    "16px",

                color:
                    "#ffffff"
            }
        )
        .setOrigin(0.5);

        this.nameBox =
            this.add.rectangle(
                500,
                295,
                360,
                65,
                0xffffff,
                0.12
            )
            .setStrokeStyle(
                3,
                0xffd166
            )
            .setInteractive();

        this.nameText =
            this.add.text(
                500,
                295,
                this.typedName ||
                (
                    IS_TOUCH_DEVICE
                        ? "TAP UNTUK KETIK"
                        : "_"
                ),
                {
                    fontFamily:
                        "Arial",

                    fontSize:
                        "25px",

                    fontStyle:
                        "bold",

                    color:
                        "#ffffff"
                }
            )
            .setOrigin(0.5)
            .setInteractive();

        this.nameBox.on(
            "pointerdown",
            () =>
                this.openNameInput()
        );

        this.nameText.on(
            "pointerdown",
            () =>
                this.openNameInput()
        );

        this.errorText =
            this.add.text(
                500,
                345,
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
            .setOrigin(0.5);

        createButton(
            this,
            500,
            410,
            270,
            58,
            "START ADVENTURE",
            () => {
                if (
                    IS_TOUCH_DEVICE &&
                    !this.typedName.trim()
                ) {
                    this.openNameInput();

                    return;
                }

                this.submitName();
            }
        );

        if (this.editing) {
            createButton(
                this,
                500,
                485,
                210,
                44,
                "BATAL",
                () =>
                    this.scene.start(
                        "MenuScene"
                    ),
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
                        event.key
                            .toUpperCase();

                    this.refreshName();
                }
            }
        );
    }

    openNameInput() {
        unlockAudio();

        const result =
            window.prompt(
                "Masukkan nama pemain (maks. 12 karakter):",
                this.typedName || ""
            );

        if (
            result === null
        ) {
            return;
        }

        this.typedName =
            String(result)
                .trim()
                .replace(
                    /\s+/g,
                    " "
                )
                .slice(0, 12)
                .toUpperCase();

        this.refreshName();
    }

    refreshName() {
        this.nameText.setText(
            this.typedName ||
            (
                IS_TOUCH_DEVICE
                    ? "TAP UNTUK KETIK"
                    : "_"
            )
        );

        this.errorText.setText("");
    }

    submitName() {
        const clean =
            savePlayerName(
                this.typedName
            );

        if (!clean) {
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
        super("MenuScene");
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

        this.add.rectangle(
            500,
            565,
            1000,
            70,
            0x3d873d
        );

        this.add.sprite(
            165,
            525,
            "jago-idle"
        )
        .setOrigin(0.5, 1)
        .setDisplaySize(
            220,
            220
        );

        this.add.sprite(
            840,
            525,
            "boar-idle"
        )
        .setOrigin(0.5, 1)
        .setDisplaySize(
            150,
            150
        )
        .setFlipX(true);

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
        .setOrigin(0.5);

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
                    "#ffffff"
            }
        )
        .setOrigin(0.5);

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
            .setOrigin(0.5);

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
            .setOrigin(0.5);

        createButton(
            this,
            500,
            240,
            300,
            54,
            "▶ PLAY",
            () =>
                this.scene.start(
                    "GameScene",
                    {
                        levelId:
                            "1-1"
                    }
                )
        );

        createButton(
            this,
            500,
            305,
            300,
            50,
            "LEVEL SELECT",
            () =>
                this.scene.start(
                    "LevelSelectScene"
                ),
            {
                color:
                    0x986128,

                stroke:
                    0x623d18
            }
        );

        createButton(
            this,
            500,
            365,
            300,
            50,
            "🏆 LEADERBOARD",
            () =>
                this.scene.start(
                    "LeaderboardScene"
                ),
            {
                color:
                    0x986128,

                stroke:
                    0x623d18
            }
        );

        createButton(
            this,
            500,
            425,
            300,
            50,
            "HOW TO PLAY",
            () =>
                this.showHelp(),
            {
                color:
                    0x986128,

                stroke:
                    0x623d18
            }
        );

        createButton(
            this,
            500,
            485,
            220,
            40,
            "UBAH NAMA",
            () =>
                this.scene.start(
                    "NameScene",
                    {
                        editing:
                            true
                    }
                ),
            {
                color:
                    0x3f4650,

                stroke:
                    0x262b31,

                fontSize:
                    "14px"
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

        if (!connected) {
            this.connectionText
                .setText(
                    "● LOCAL MODE"
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
            onlineBest !== null
        ) {
            this.bestText.setText(
                `PLAYER: ${this.playerName} • BEST ONLINE: ${onlineBest}`
            );
        }
    }

    showHelp() {
        this.add.rectangle(
            500,
            300,
            1000,
            600,
            0x07111f,
            0.96
        )
        .setDepth(500);

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
        .setOrigin(0.5)
        .setDepth(501);

        this.add.text(
            500,
            280,
            "← → Bergerak\n\n" +
            "SPACE / ↑ Melompat\n\n" +
            "Kumpulkan Token 57\n\n" +
            "Injak boar dari atas\n\n" +
            "WORLD 1-3 memiliki Boss Boar\n\n" +
            "HP: gunakan ◀ ▶ dan ▲ bersamaan",
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
        .setOrigin(0.5)
        .setDepth(501);

        createButton(
            this,
            500,
            520,
            220,
            52,
            "KEMBALI",
            () =>
                this.scene.restart(),
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
            65,
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
        .setOrigin(0.5);

        this.levelCard(
            200,
            300,
            "WORLD 1-1",
            "GREEN VALLEY",
            true,
            "1-1"
        );

        this.levelCard(
            500,
            300,
            "WORLD 1-2",
            progress.world12
                ? "WILD RIDGE"
                : "LOCKED",
            progress.world12,
            "1-2"
        );

        this.levelCard(
            800,
            300,
            "WORLD 1-3",
            progress.world13
                ? "BOAR FORTRESS"
                : "LOCKED",
            progress.world13,
            "1-3"
        );

        createButton(
            this,
            500,
            510,
            220,
            52,
            "← MENU",
            () =>
                this.scene.start(
                    "MenuScene"
                )
        );
    }

    levelCard(
        x,
        y,
        title,
        subtitle,
        unlocked,
        levelId
    ) {
        const panel =
            this.add.rectangle(
                x,
                y,
                250,
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
            .setInteractive();

        this.add.text(
            x,
            y - 55,
            unlocked
                ? "✓"
                : "🔒",
            {
                fontSize:
                    "38px",

                color:
                    "#ffffff"
            }
        )
        .setOrigin(0.5);

        this.add.text(
            x,
            y + 10,
            title,
            {
                fontSize:
                    "22px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"
            }
        )
        .setOrigin(0.5);

        this.add.text(
            x,
            y + 52,
            subtitle,
            {
                fontSize:
                    "13px",

                color:
                    "#ffffff"
            }
        )
        .setOrigin(0.5);

        panel.on(
            "pointerdown",
            () => {
                if (!unlocked) {
                    return;
                }

                SFX.button();

                this.scene.start(
                    "GameScene",
                    {
                        levelId
                    }
                );
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
                fontSize:
                    "40px",

                fontStyle:
                    "bold",

                color:
                    "#FFD166"
            }
        )
        .setOrigin(0.5);

        this.statusText =
            this.add.text(
                500,
                100,
                "Mengambil data...",
                {
                    fontSize:
                        "15px",

                    color:
                        "#ffffff"
                }
            )
            .setOrigin(0.5);

        this.boardObjects = [];

        createButton(
            this,
            620,
            545,
            210,
            48,
            "← MENU",
            () =>
                this.scene.start(
                    "MenuScene"
                )
        );

        this.loadBoard();
    }

    clearBoard() {
        this.boardObjects
            .forEach(
                object => {
                    if (
                        object?.active
                    ) {
                        object.destroy();
                    }
                }
            );

        this.boardObjects = [];
    }

    async loadBoard() {
        const online =
            await getOnlineLeaderboard();

        if (
            !this.scene.isActive(
                "LeaderboardScene"
            )
        ) {
            return;
        }

        this.renderBoard(
            online ||
            loadLocalLeaderboard()
        );
    }

    renderBoard(board) {
        this.clearBoard();

        const panel =
            this.add.rectangle(
                500,
                325,
                620,
                365,
                0x162230
            );

        this.boardObjects.push(panel);

        const currentName =
            getPlayerName()
                .toUpperCase();

        board.forEach(
            (entry, index) => {
                const y =
                    175 +
                    index * 32;

                const mine =
                    entry.name ===
                    currentName;

                const color =
                    mine
                        ? "#FFD166"
                        : "#ffffff";

                const text =
                    this.add.text(
                        250,
                        y,
                        `${index + 1}.   ${entry.name}       ${entry.score}   W ${entry.levelId}`,
                        {
                            fontSize:
                                "17px",

                            color
                        }
                    );

                this.boardObjects.push(
                    text
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
        super("GameScene");
    }

    init(data) {
        this.levelId =
            LEVELS[data?.levelId]
                ? data.levelId
                : "1-1";

        this.level =
            LEVELS[this.levelId];
    }

    create() {
        this.playerName =
            getPlayerName() ||
            "PLAYER";

        this.score = 0;
        this.lives = 3;

        this.checkpointX =
            this.level.startX;

        this.checkpointY =
            this.level.startY;

        this.checkpointActive =
            false;

        this.respawning =
            false;

        this.invulnerable =
            false;

        this.gameFinished =
            false;

        this.gameOverActive =
            false;

        this.facingLeft =
            false;

        this.enemies = [];

        this.boss = null;

        this.bossDefeated =
            !this.level.boss;

        // =================================================
        // MOBILE INPUT
        // =================================================

        this.mobileInput = {
            left: false,
            right: false,
            jump: false
        };

        // Pointer ID setiap jari disimpan sendiri.
        // Ini yang memperbaiki bug iPhone.
        this.mobilePointers = {
            left: null,
            right: null,
            jump: null
        };

        if (IS_TOUCH_DEVICE) {
            // Dukungan beberapa jari sekaligus
            this.input.addPointer(3);
        }

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

        this.add.rectangle(
            this.level.worldWidth / 2,
            300,
            this.level.worldWidth,
            600,
            this.levelId === "1-3"
                ? 0x8f96a3
                : 0x87ceeb
        );

        this.add.circle(
            800,
            105,
            52,
            0xffd54f
        );

        const grounds =
            this.groundSegments();

        const platforms =
            this.level.platforms.map(
                p =>
                    this.platform(
                        ...p
                    )
            );

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
            .setOrigin(0.5, 1)
            .setDisplaySize(
                PLAYER_VISUAL_SIZE,
                PLAYER_VISUAL_SIZE
            )
            .setDepth(20);

        grounds.forEach(
            ground =>
                this.physics.add.collider(
                    this.playerBody,
                    ground
                )
        );

        platforms.forEach(
            platform =>
                this.physics.add.collider(
                    this.playerBody,
                    platform
                )
        );

        this.cursors =
            this.input.keyboard
                .createCursorKeys();

        this.level.tokens
            .forEach(
                token =>
                    this.token(
                        ...token
                    )
            );

        this.level.boars
            .forEach(
                boar =>
                    this.boar(
                        ...boar
                    )
            );

        if (
            this.level.boss
        ) {
            this.createBoss(
                this.level.boss
            );
        }

        this.checkpoint();
        this.finish();
        this.hud();

        this.syncPlayerVisual();
    }

    groundSegments() {
        const grounds = [];

        let cursor = 0;

        this.level.gaps.forEach(
            ([start, end]) => {
                if (
                    start > cursor
                ) {
                    grounds.push(
                        this.ground(
                            cursor,
                            start
                        )
                    );
                }

                cursor = end;
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

    ground(start, end) {
        const width =
            end - start;

        const center =
            start +
            width / 2;

        const body =
            this.add.rectangle(
                center,
                565,
                width,
                70,
                this.levelId === "1-3"
                    ? 0x474c52
                    : 0x3d873d
            );

        this.physics.add.existing(
            body,
            true
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

        return body;
    }

    token(x, y) {
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
                    fontSize:
                        "15px",

                    fontStyle:
                        "bold",

                    color:
                        "#6b4600"
                }
            )
            .setOrigin(0.5);

        this.physics.add.overlap(
            this.playerBody,
            token,
            () => {
                if (!token.active) {
                    return;
                }

                SFX.token();

                this.score += 57;

                this.updateScore();

                token.destroy();
                text.destroy();
            }
        );
    }

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

        body.body.setVelocityX(
            BOAR_SPEED
        );

        const sprite =
            this.add.sprite(
                x,
                y,
                "boar-idle"
            )
            .setOrigin(0.5, 1)
            .setDisplaySize(
                BOAR_VISUAL_SIZE,
                BOAR_VISUAL_SIZE
            );

        sprite.play(
            "boar-walk"
        );

        const enemy = {
            body,
            sprite,
            leftLimit,
            rightLimit,
            alive: true
        };

        this.enemies.push(enemy);

        this.physics.add.overlap(
            this.playerBody,
            body,
            () =>
                this.handleBoar(
                    enemy
                )
        );
    }

    handleBoar(enemy) {
        if (
            !enemy.alive ||
            this.respawning ||
            this.invulnerable
        ) {
            return;
        }

        const falling =
            this.playerBody.body
                .velocity.y > 80;

        if (
            falling &&
            this.playerBody.body
                .bottom <
            enemy.body.body.top +
            32
        ) {
            enemy.alive = false;

            enemy.body.body.enable =
                false;

            enemy.sprite.stop();

            SFX.stomp();

            this.score += 100;

            this.updateScore();

            this.playerBody.body
                .setVelocityY(
                    -330
                );

            enemy.sprite.destroy();
            enemy.body.destroy();

            return;
        }

        this.loseLife();
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
                        .setFlipX(false);
                }

                if (
                    enemy.body.x >=
                    enemy.rightLimit
                ) {
                    enemy.body.body
                        .setVelocityX(
                            -BOAR_SPEED
                        );

                    enemy.sprite
                        .setFlipX(true);
                }

                enemy.sprite.setPosition(
                    enemy.body.x,
                    enemy.body.body.bottom +
                    3
                );
            }
        );
    }

    // =================================================
    // BOSS
    // =================================================

    createBoss(config) {
        const body =
            this.add.rectangle(
                config.x,
                config.y,
                120,
                90,
                0xff0000,
                0
            );

        this.physics.add.existing(
            body
        );

        body.body.setAllowGravity(
            false
        );

        const sprite =
            this.add.sprite(
                config.x,
                config.y,
                "boar-idle"
            )
            .setOrigin(0.5, 1)
            .setDisplaySize(
                BOSS_VISUAL_SIZE,
                BOSS_VISUAL_SIZE
            )
            .setTint(
                0x8f5a3c
            );

        sprite.play(
            "boar-walk"
        );

        this.boss = {
            body,
            sprite,

            hp:
                config.hp,

            maxHp:
                config.hp,

            leftLimit:
                config.left,

            rightLimit:
                config.right,

            speed:
                120,

            alive:
                true,

            invulnerable:
                false
        };

        body.body.setVelocityX(
            -120
        );

        this.physics.add.overlap(
            this.playerBody,
            body,
            () =>
                this.handleBoss()
        );
    }

    handleBoss() {
        if (
            !this.boss ||
            !this.boss.alive ||
            this.boss.invulnerable ||
            this.invulnerable
        ) {
            return;
        }

        const falling =
            this.playerBody.body
                .velocity.y > 100;

        if (
            falling &&
            this.playerBody.body
                .bottom <
            this.boss.body.body.top +
            50
        ) {
            this.damageBoss();

            this.playerBody.body
                .setVelocityY(
                    -390
                );

            return;
        }

        this.loseLife();
    }

    damageBoss() {
        this.boss.hp--;

        this.boss.invulnerable =
            true;

        SFX.bossHit();

        this.score += 150;

        this.updateScore();
        this.updateBossHud();

        if (
            this.boss.hp <= 0
        ) {
            this.defeatBoss();

            return;
        }

        this.boss.speed += 18;

        this.time.delayedCall(
            600,
            () => {
                if (
                    this.boss?.alive
                ) {
                    this.boss.invulnerable =
                        false;
                }
            }
        );
    }

    defeatBoss() {
        this.boss.alive = false;

        this.boss.body.body.enable =
            false;

        this.boss.sprite.destroy();

        this.bossDefeated = true;

        this.score += 500;

        this.updateScore();
        this.updateBossHud();
    }

    updateBoss() {
        if (
            !this.boss ||
            !this.boss.alive
        ) {
            return;
        }

        if (
            this.boss.body.x <=
            this.boss.leftLimit
        ) {
            this.boss.body.body
                .setVelocityX(
                    this.boss.speed
                );

            this.boss.sprite
                .setFlipX(false);
        }

        if (
            this.boss.body.x >=
            this.boss.rightLimit
        ) {
            this.boss.body.body
                .setVelocityX(
                    -this.boss.speed
                );

            this.boss.sprite
                .setFlipX(true);
        }

        this.boss.sprite.setPosition(
            this.boss.body.x,
            this.boss.body.body.bottom +
            5
        );
    }

    // =================================================
    // CHECKPOINT
    // =================================================

    checkpoint() {
        const x =
            this.level.checkpointX;

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
                if (
                    this.checkpointActive
                ) {
                    return;
                }

                this.checkpointActive =
                    true;

                this.checkpointX =
                    x + 50;

                this.checkpointY =
                    430;

                this.checkpointStatusText
                    .setText(
                        "CHECKPOINT: AKTIF"
                    );

                SFX.checkpoint();
            }
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

        this.add.text(
            x - 45,
            300,
            "FINISH",
            {
                fontSize:
                    "24px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"
            }
        );

        this.physics.add.overlap(
            this.playerBody,
            zone,
            () => {
                if (
                    this.level.boss &&
                    !this.bossDefeated
                ) {
                    return;
                }

                this.finishLevel();
            }
        );
    }

    // =================================================
    // HUD
    // =================================================

    hud() {
        this.add.text(
            35,
            20,
            "JAGO57",
            {
                fontSize:
                    "34px",

                fontStyle:
                    "bold",

                color:
                    "#FFD166"
            }
        )
        .setScrollFactor(0)
        .setDepth(100);

        this.add.text(
            35,
            62,
            `${this.level.name} • ${this.level.subtitle}`,
            {
                fontSize:
                    "14px",

                color:
                    "#ffffff"
            }
        )
        .setScrollFactor(0)
        .setDepth(100);

        this.scoreText =
            this.add.text(
                720,
                20,
                "57 POINTS: 0",
                {
                    fontSize:
                        "19px",

                    color:
                        "#ffffff"
                }
            )
            .setScrollFactor(0)
            .setDepth(100);

        this.livesText =
            this.add.text(
                720,
                52,
                "LIVES: ♥ ♥ ♥",
                {
                    fontSize:
                        "17px",

                    color:
                        "#ffffff"
                }
            )
            .setScrollFactor(0)
            .setDepth(100);

        this.checkpointStatusText =
            this.add.text(
                720,
                82,
                "CHECKPOINT: START",
                {
                    fontSize:
                        "12px",

                    color:
                        "#ffffff"
                }
            )
            .setScrollFactor(0)
            .setDepth(100);

        if (
            this.level.boss
        ) {
            this.bossHud =
                this.add.text(
                    500,
                    20,
                    "BOSS HP: ♥ ♥ ♥ ♥ ♥",
                    {
                        fontSize:
                            "16px",

                        fontStyle:
                            "bold",

                        color:
                            "#ffb089",

                        backgroundColor:
                            "#07111f",

                        padding: {
                            x: 12,
                            y: 6
                        }
                    }
                )
                .setOrigin(0.5, 0)
                .setScrollFactor(0)
                .setDepth(120);
        }

        if (
            IS_TOUCH_DEVICE
        ) {
            this.mobileControls();
        }
    }

    updateBossHud() {
        if (
            !this.bossHud ||
            !this.boss
        ) {
            return;
        }

        if (
            this.boss.hp <= 0
        ) {
            this.bossHud.setText(
                "BOSS DIKALAHKAN ✓"
            );

            return;
        }

        this.bossHud.setText(
            `BOSS HP: ${"♥ ".repeat(
                this.boss.hp
            )}`
        );
    }

    // =================================================
    // IPHONE / MOBILE MULTITOUCH FIX
    // =================================================

    releaseMobilePointer(
        pointer
    ) {
        if (
            !pointer ||
            !this.mobilePointers
        ) {
            return;
        }

        if (
            this.mobilePointers.left ===
            pointer.id
        ) {
            this.mobileInput.left =
                false;

            this.mobilePointers.left =
                null;
        }

        if (
            this.mobilePointers.right ===
            pointer.id
        ) {
            this.mobileInput.right =
                false;

            this.mobilePointers.right =
                null;
        }

        if (
            this.mobilePointers.jump ===
            pointer.id
        ) {
            this.mobileInput.jump =
                false;

            this.mobilePointers.jump =
                null;
        }
    }

    mobileControls() {
        const left =
            this.add.rectangle(
                85,
                515,
                105,
                85,
                0x07111f,
                0.72
            )
            .setScrollFactor(0)
            .setDepth(150)
            .setInteractive();

        const right =
            this.add.rectangle(
                210,
                515,
                105,
                85,
                0x07111f,
                0.72
            )
            .setScrollFactor(0)
            .setDepth(150)
            .setInteractive();

        const jump =
            this.add.circle(
                895,
                505,
                55,
                0x4b9b44,
                0.82
            )
            .setScrollFactor(0)
            .setDepth(150)
            .setInteractive();

        this.add.text(
            85,
            515,
            "◀",
            {
                fontSize:
                    "38px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(151);

        this.add.text(
            210,
            515,
            "▶",
            {
                fontSize:
                    "38px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(151);

        this.add.text(
            895,
            505,
            "▲",
            {
                fontSize:
                    "38px",

                fontStyle:
                    "bold",

                color:
                    "#ffffff"
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(151);

        // LEFT

        left.on(
            "pointerdown",
            pointer => {
                this.mobilePointers.left =
                    pointer.id;

                this.mobileInput.left =
                    true;
            }
        );

        left.on(
            "pointerup",
            pointer =>
                this.releaseMobilePointer(
                    pointer
                )
        );

        left.on(
            "pointerout",
            pointer => {
                if (
                    this.mobilePointers.left ===
                    pointer.id
                ) {
                    this.mobileInput.left =
                        false;

                    this.mobilePointers.left =
                        null;
                }
            }
        );

        // RIGHT

        right.on(
            "pointerdown",
            pointer => {
                this.mobilePointers.right =
                    pointer.id;

                this.mobileInput.right =
                    true;
            }
        );

        right.on(
            "pointerup",
            pointer =>
                this.releaseMobilePointer(
                    pointer
                )
        );

        right.on(
            "pointerout",
            pointer => {
                if (
                    this.mobilePointers.right ===
                    pointer.id
                ) {
                    this.mobileInput.right =
                        false;

                    this.mobilePointers.right =
                        null;
                }
            }
        );

        // JUMP

        jump.on(
            "pointerdown",
            pointer => {
                this.mobilePointers.jump =
                    pointer.id;

                this.mobileInput.jump =
                    true;
            }
        );

        jump.on(
            "pointerup",
            pointer =>
                this.releaseMobilePointer(
                    pointer
                )
        );

        jump.on(
            "pointerout",
            pointer => {
                if (
                    this.mobilePointers.jump ===
                    pointer.id
                ) {
                    this.mobileInput.jump =
                        false;

                    this.mobilePointers.jump =
                        null;
                }
            }
        );

        // PENTING:
        // Hanya kontrol milik pointer/jari
        // yang dilepas yang dimatikan.
        this.input.on(
            "pointerup",
            pointer =>
                this.releaseMobilePointer(
                    pointer
                )
        );
    }

    // =================================================
    // PLAYER STATUS
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

        this.lives--;

        this.updateLives();

        if (
            this.lives <= 0
        ) {
            this.showGameOver();

            return;
        }

        this.respawnPlayer();
    }

    respawnPlayer() {
        this.respawning = true;
        this.invulnerable = true;

        this.mobileInput.left =
            false;

        this.mobileInput.right =
            false;

        this.mobileInput.jump =
            false;

        this.mobilePointers.left =
            null;

        this.mobilePointers.right =
            null;

        this.mobilePointers.jump =
            null;

        this.playerBody.body.enable =
            false;

        this.playerSprite.setAlpha(
            0
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

                this.playerBody.body.setVelocity(
                    0,
                    0
                );

                this.playerSprite
                    .setTexture(
                        "jago-idle"
                    )
                    .setAlpha(1)
                    .setAngle(0);

                this.syncPlayerVisual();

                this.respawning =
                    false;

                this.time.delayedCall(
                    1000,
                    () => {
                        this.invulnerable =
                            false;

                        this.playerSprite
                            .setAlpha(1);
                    }
                );
            }
        );
    }

    syncPlayerVisual() {
        if (
            !this.playerBody?.body
        ) {
            return;
        }

        this.playerSprite.setPosition(
            this.playerBody.x,
            this.playerBody.body.bottom +
            PLAYER_FEET_OFFSET
        );
    }

    showGameOver() {
        this.gameOverActive = true;

        this.playerBody.body.enable =
            false;

        this.resultPanel(
            "GAME OVER",
            false,
            false
        );
    }

    async finishLevel() {
        if (
            this.gameFinished
        ) {
            return;
        }

        this.gameFinished = true;

        const progress =
            loadProgress();

        if (
            this.levelId === "1-1"
        ) {
            progress.world12 = true;
        }

        if (
            this.levelId === "1-2"
        ) {
            progress.world13 = true;
        }

        saveProgress(progress);

        submitLocalScore(
            this.playerName,
            this.score,
            this.levelId
        );

        const uploaded =
            await submitOnlineScore(
                this.playerName,
                this.score,
                this.levelId
            );

        if (
            !this.scene.isActive(
                "GameScene"
            )
        ) {
            return;
        }

        SFX.finish();

        this.resultPanel(
            `${this.level.name} COMPLETE!`,
            true,
            uploaded
        );
    }

    resultPanel(
        title,
        completed,
        uploaded
    ) {
        this.add.rectangle(
            500,
            300,
            650,
            400,
            0x07111f,
            0.97
        )
        .setScrollFactor(0)
        .setDepth(1000);

        this.add.text(
            500,
            155,
            title,
            {
                fontSize:
                    "32px",

                fontStyle:
                    "bold",

                color:
                    "#FFD166"
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1001);

        this.add.text(
            500,
            225,
            `57 POINTS: ${this.score}`,
            {
                fontSize:
                    "24px",

                color:
                    "#ffffff"
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1001);

        if (completed) {
            this.add.text(
                500,
                285,
                uploaded
                    ? "✓ SKOR TERSIMPAN ONLINE"
                    : "✓ SKOR TERSIMPAN LOKAL",
                {
                    fontSize:
                        "16px",

                    color:
                        uploaded
                            ? "#8cff9c"
                            : "#FFD166"
                }
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);
        }

        createButton(
            this,
            350,
            400,
            190,
            48,
            "ULANGI",
            () =>
                this.scene.restart({
                    levelId:
                        this.levelId
                }),
            {
                fixed:
                    true,

                depth:
                    1002
            }
        );

        createButton(
            this,
            650,
            400,
            190,
            48,
            "MENU",
            () =>
                this.scene.start(
                    "MenuScene"
                ),
            {
                fixed:
                    true,

                depth:
                    1002
            }
        );

        if (
            completed &&
            this.levelId ===
            "1-1"
        ) {
            createButton(
                this,
                500,
                470,
                260,
                48,
                "LANJUT WORLD 1-2 ▶",
                () =>
                    this.scene.start(
                        "GameScene",
                        {
                            levelId:
                                "1-2"
                        }
                    ),
                {
                    fixed:
                        true,

                    depth:
                        1002
                }
            );
        }

        if (
            completed &&
            this.levelId ===
            "1-2"
        ) {
            createButton(
                this,
                500,
                470,
                260,
                48,
                "LANJUT WORLD 1-3 ▶",
                () =>
                    this.scene.start(
                        "GameScene",
                        {
                            levelId:
                                "1-3"
                        }
                    ),
                {
                    fixed:
                        true,

                    depth:
                        1002
                }
            );
        }
    }

    // =================================================
    // UPDATE LOOP
    // =================================================

    update() {
        this.updateEnemies();

        this.updateBoss();

        if (
            this.respawning ||
            this.gameFinished ||
            this.gameOverActive
        ) {
            return;
        }

        if (
            this.playerBody.y > 700
        ) {
            this.loseLife();

            return;
        }

        this.playerBody.body
            .setVelocityX(0);

        const onGround =
            this.playerBody.body
                .blocked.down ||
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

            this.facingLeft = true;

            this.playerSprite
                .setFlipX(true);

            if (onGround) {
                this.playerSprite.play(
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

            this.facingLeft = false;

            this.playerSprite
                .setFlipX(false);

            if (onGround) {
                this.playerSprite.play(
                    "jago-run",
                    true
                );
            }
        }

        else if (onGround) {
            this.playerSprite.stop();

            this.playerSprite
                .setTexture(
                    "jago-idle"
                );
        }

        // =================================================
        // JUMP
        //
        // mobileInput.jump adalah "tap event".
        // Setelah dibaca, hanya jump yang di-reset.
        // LEFT / RIGHT TIDAK disentuh.
        // =================================================

        const mobileJumpPressed =
            this.mobileInput.jump;

        this.mobileInput.jump =
            false;

        const jumpPressed =
            Phaser.Input.Keyboard
                .JustDown(
                    this.cursors.up
                ) ||
            Phaser.Input.Keyboard
                .JustDown(
                    this.cursors.space
                ) ||
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

        if (!onGround) {
            this.playerSprite.stop();

            this.playerSprite
                .setTexture(
                    this.playerBody.body
                        .velocity.y < 0
                        ? "jago-run-4"
                        : "jago-run-5"
                );
        }

        this.syncPlayerVisual();

        const cameraX =
            Phaser.Math.Clamp(
                this.playerBody.x -
                350,
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
// PHASER CONFIG
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
        "#07111f",

    scale: {
        mode:
            Phaser.Scale.FIT,

        autoCenter:
            Phaser.Scale.CENTER_BOTH,

        width:
            GAME_WIDTH,

        height:
            GAME_HEIGHT
    },

    physics: {
        default:
            "arcade",

        arcade: {
            gravity: {
                y: 900
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

// =====================================================
// SAFE START
// =====================================================

if (
    window.__JAGO57_GAME__
) {
    try {
        window
            .__JAGO57_GAME__
            .destroy(true);
    } catch {}

    window.__JAGO57_GAME__ =
        null;
}

const gameContainer =
    document.getElementById(
        "game-container"
    );

if (gameContainer) {
    gameContainer.replaceChildren();
}

window.__JAGO57_GAME__ =
    new Phaser.Game(
        gameConfig
    );

if (import.meta.hot) {
    import.meta.hot.dispose(
        () => {
            if (
                window.__JAGO57_GAME__
            ) {
                try {
                    window
                        .__JAGO57_GAME__
                        .destroy(true);
                } catch {}

                window.__JAGO57_GAME__ =
                    null;
            }

            const container =
                document.getElementById(
                    "game-container"
                );

            if (container) {
                container.replaceChildren();
            }
        }
    );
}