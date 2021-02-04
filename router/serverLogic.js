const express = require('express')
const auth = require('../middleware/auth')
const steamprice = require('steam-price-api');
const router = new express.Router()
const User = require('../models/user')
const Skin = require('../models/skin')
const log = console.log

router.get('/get-user', auth, async(req, res) => {
  return res.status(200).send(req.user)
})

router.post('/set-referral', auth, async(req, res) => {
  const referralCode = req.body.referralCode

  try {
    req.user.referredTo = referralCode

    res.status(200).send()
  } catch(err) {
    res.status(400).send(err)
  }
})

router.post('/signup', async (req, res) => {
  const username = req.body.username
  const email = req.body.email
  const password = req.body.password
  const tradeURL = req.body.tradeURL

  try {
    let emailTaken = await User.findOne({ email })
    let usernameTaken = await User.findOne({ username })

    if (usernameTaken) {
      return res.status(400).send('Username is taken.')
    }

    if (!emailTaken) {
      const userForSave = new User({
        username,
        email,
        password,
        tradeURL
      })

      const user = await userForSave.save()

      const token = await userForSave.generateAuthToken()

      return res.status(201).send({ user, token })
    } else {
      return res.status(400).send('E-mail already exists.')
    }
  } catch(err) {
    log(err)
    return res.status(500).send(err)
  }
})

router.post('/login', async (req, res) => {
  const email = req.body.email
  const password = req.body.password

  try {
      const user = await User.findByCredentials(email, password)
      const token = await user.generateAuthToken()
      res.status(200).send({ user, token })
  } catch(err) {
      log(err)
      res.status(400).send("error") 
  }
})

router.get('/logout', auth, async(req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch(err) {
        res.status(500).send()
    }
})

router.get('/get-user-credits', auth, async(req, res) => {
  const id = req.user._id

  try {
    const user = await User.findById(id, `credits -_id`)
    
    res.status(200).send(user)
  } catch(err) {
    res.status(400).send(err)
  }
})

router.post('/get-wpn-prices', async(req, res) => {
  const id = req.user._id
  const wpns = req.body.wpns

  try {
    // const user = await User.findOne({ uid }, `credits -_id`)

    let price
    price = await steamprice.getprices(730, wpns, '1')


    console.log(price)
    res.status(200).send(price)
  } catch(err) {
    res.status(400).send(err)
  }
})

router.get('/get-user-skins', auth, async(req, res) => {
  const id = req.user._id

  try {
    const user = await User.findById(id, `skins -_id`)

    let skins = []
    await Promise.all(user.skins.map(async (skinID) => {
      let data = await Skin.findById(skinID)

      skins.push(data)
    }))

    return res.status(200).send(skins)
  } catch(err) {
    log(err)
    return res.status(400).send(err) 
  }

})

const getWeapon = (caseName) => {
  const wpnCases = {
    dangerZone: {
      mil_spec: [
        'nova_wood_fired',
        'sawed-off_black_sand',
        'sg553_danger_close',
        'mp9_modest_threat',
        'tec-9_fubar',
        'glock-18_oxide_blaze',
        'm4a4_magnesium'
      ],
      restricted: [
        'g3sg1_scavenger',
        'mac-10_pipe_down',
        'galil_ar_signal',
        'p250_nevermore',
        'usp-s_flashback'
      ],
      classified: [
        'mp5-sd_phosphor',
        'ump-45_momentum',
        'desert_eagle_mecha_industries'
      ],
      covert: [
        'awp_neo-noir',
        'ak-47_asiimov'
      ]
    },
    phoenix: {
      mil_spec: [
        'ump-45_corporal',
        'mag-7_heaven_guard',
        'negev_terrain',
        'tec-9_sandstorm'
      ],
      restricted: [
        'famas_sergeant',
        'mac-10_heat',
        'sg_553_pulse',
        'usp-s_guardian',
      ],
      classified: [
        'p90_trigon',
        'nova_antique',
        'dak-47_redline',
      ],
      covert: [
        'aug_chameleon',
        'awp_asiimov'
      ]
    },
    chroma2: {
      mil_spec: [
        "negev_man-o-'war",
        'sawed-off_origami',
        'mp7_armor_core',
        'p250_valence',
        'desert_eagle_bronze_deco',
        'ak-47_elite_build'
      ],
      restricted: [
        'ump-45_grand_prix',
        'cz75-auto_pole_position',
        'mag-7_heat',
        'awp_worm_god',
      ],
      classified: [
        'famas_djinn',
        'five-seven_monkey_business',
        'galil_ar_eco',
      ],
      covert: [
        'mac-10_neon_rider',
        'm4a1-s_hyper_beast'
      ]
    },
    fracture: {
      mil_spec: [
        'negev_ultralight',
        "sg_553_ol'rusty",
        'p2000_gnarled',
        'p90_freight',
        'pp-bizon_runic',
        'p250_cassette',
        'ssg_08_mainframe_001'
      ],
      restricted: [
        'galil_ar_connexion',
        'mp5-sd_kitbash',
        'tec-9_brother',
        'mac-10_allure',
        'mag-7_monster_call'
      ],
      classified: [
        'xm1014_entombed',
        'glock-18_vogue',
        'm4a4_toothfairy',
      ],
      covert: [
        'ak-47_legion_of_anubis',
        'desert_eagle_printstream'
      ]
    },
    clutch: {
      mil_spec: [
        'xm1014_oxide_blaze',
        'pp-bizon_night_riot',
        'p2000_urban_hazard',
        'five-seven_flame_test',
        'sg_553_aloha',
        'r8_revolver_grip',
        'mp9_black_sand'
      ],
      restricted: [
        'negev_lionfish',
        'nova_wild_six',
        'ump-45_artic_wolf',
        'mag-7_swag-7',
        'glock-18_moonrise'
      ],
      classified: [
        'aug_stymphalian',
        'awp_mortis',
        'usp-s_cortex',
      ],
      covert: [
        'mp7_bloodsport',
        'm4a4_neo-noir'
      ]
    }
  }

  const formattedSkinName = {
    dangerZone: {
      mil_spec: [
        'Wood Fired',
        'Black Sand',
        'Danger Close',
        'Modest Threat',
        'Fubar',
        'Oxide Blaze',
        'Magnesium'
      ],
      restricted: [
        'Scavenger',
        'Pipe Down',
        'Signal',
        'Nevermore',
        'Flashback',
      ],
      classified: [
        'Phosphor',
        'Momentum',
        'Mecha Industries'
      ],
      covert: [
        'Neo-Noir',
        'Asiimov'
      ]
    },
    phoenix: {
      mil_spec: [
        'Corporal',
        'Heaven Guard',
        'Terrain',
        'Sandstorm'
      ],
      restricted: [
        'Sergeant',
        'Heat',
        'Pulse',
        'Guardian',
      ],
      classified: [
        'Guardian',
        'Antique',
        'Redline',
      ],
      covert: [
        'Chameleon',
        'Asiimov'
      ]
    },
    chroma2: {
      mil_spec: [
        "Man-o'-war",
        'Origami',
        'Armor Core',
        'Valence',
        'Bronze Deco',
        'Elite Build'
      ],
      restricted: [
        'Grand Prix',
        'Pole Position',
        'Heat',
        'Worm God',
      ],
      classified: [
        'Djinn',
        'Monkey Business',
        'Eco',
      ],
      covert: [
        'Neon Rider',
        'Hyper Beast'
      ]
    },
    fracture: {
      mil_spec: [
        'Ultralight',
        "Ol' Rusty",
        'Gnarled',
        'Freight',
        'Runic',
        'Cassette',
        'Mainframe 001'
      ],
      restricted: [
        'Connexion',
        'Kitbash',
        'Brother',
        'Allure',
        'Monster Call'
      ],
      classified: [
        'Entombed',
        'Vogue',
        'Tooth Fairy',
      ],
      covert: [
        'Legion of Anubis',
        'Printstream'
      ]
    },
    clutch: {
      mil_spec: [
        'Oxide Blaze',
        'Night Riot',
        'Urban Hazard',
        'Flame Test',
        'Aloha',
        'Grip',
        'Black Sand'
      ],
      restricted: [
        'Lionfish',
        'Wild Six',
        'Arctic Wolf',
        'SWAG-7',
        'Moonrise'
      ],
      classified: [
        'Stymphalian',
        'Mortis',
        'Cortex',
      ],
      covert: [
        'Bloodsport',
        'Neo-Noir'
      ]
    }
  }

  let skinGrade
  let skinCon

  // Get Skin Grade
  skinGrade = Math.random() * 100
  skinGrade = Math.round(skinGrade * 100) / 100

  const getGrade = () => {
    if (skinGrade >= 0 && skinGrade < 5.00) return 'classified' 
    else if (skinGrade >= 5.00 && skinGrade < 16.00) return 'restricted'
    else if (skinGrade >= 16.00) return 'mil_spec'
  }

  skinGrade = getGrade()

  // Get Skin Condition
  // For Covert
  if (skinGrade === 'covert') {
    skinCon = 'bs'
  }
  // For Classified
  else if (skinGrade === 'classified') {
    const num = Math.round(skinCon * 100) / 100

    if (num < 15) {
      skinCon = 'ww'
    } else {
      skinCon = 'bs'
    }
  }
  // For below Classified shuffle condition normally
  else {
    // Get Skin condition
    skinCon = Math.random() * 100
    skinCon = Math.round(skinCon * 100) / 100

    const getCondition = () => {
      if (skinCon <= 1) return 'fn'
      else if (skinCon >= 1 && skinCon < 7) return 'mw'
      else if (skinCon >= 7 && skinCon < 35) return 'ft'
      else if (skinCon >= 35 && skinCon < 70) return 'ww'
      else if (skinCon >= 70) return 'bs'
    }

    skinCon = getCondition()
  }

  const arrLen = wpnCases[caseName][skinGrade].length
  const skinIndex = Math.floor(Math.random() * (arrLen - 0) + 0)

  const skin = wpnCases[caseName][skinGrade][skinIndex]
  const formattedSkin = formattedSkinName[caseName][skinGrade][skinIndex]

  return { formattedSkin, skin, skinGrade, skinCon }
}

router.post('/buy-case', auth, async(req, res) => {
  // % to get gun grade
  // mil_spec: 89.0, // blue
  // restricted: 10.8, // purple
  // classified: 0.20, // pink
  // covert: 0.00, // red
  // exceedingly_rare: 0.00 // yellow

  // % to get gun condition
  // fn: 3,
  // mw: 7,
  // ft: 40,
  // ww: 30,
  // bs: 20

  const id = req.user._id
  const caseName = req.body.caseName

  const cases = ['dangerZone', 'chroma2', 'clutch', 'fracture', 'phoenix']
  const casePrices = [600, 750, 900, 1400, 1800]

  const caseIndex = cases.indexOf(caseName)

  const user = await User.findById(id, `credits tradeURL -_id`)
  const userCredits = user.credits
  const creditsRequired = casePrices[caseIndex]

  let skinGrade
  let skinCon

  let skin
  let formattedSkin
  if (userCredits >= creditsRequired) {
    const data = getWeapon(caseName)
    skinGrade = data.skinGrade
    skinCon = data.skinCon
    skin = data.skin
    formattedSkin = data.formattedSkin

    try {
      await User.findByIdAndUpdate(id, {
        credits: userCredits - creditsRequired
      })

      const saveSkin = new Skin({
        skin,
        grade: skinGrade,
        condition: skinCon,
        caseName,
        userID: id
      })

      saveSkin.save()

      // Save Skin reference to User
      const userSaveSkinRef = await User.findById(id)
      userSaveSkinRef.skins.push(saveSkin._id)
      await userSaveSkinRef.save()
    } catch(err) {
      log(err)
    }
  } else {
    return res.status(400).send("Not enough moneros Sunny. And cheating ain't nice")
  }

  res.status(200).send({ skin: formattedSkin, skinLonghand: skin, skinGrade, skinCon })
})

router.get('/check-profitability', async(req, res) => {
  const key = req.body.key // secret key

  const casePrice = 0.6

  let skinPrices = 0
  let caseIncome = 0
  let querySkins = []
  let casesOpened = 0

  const amountOfDrops = 1000

  const shorthandCondition = ['fn', 'mw', 'ft', 'ww', 'bs']
  const conditions = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred']

  const skins = [
    "desert_eagle_mecha_industries",
    "mp5-sd_phosphor",
    "ump-45_momentum",
    "usp-s_flashback",
    "p250_nevermore",
    "galil_ar_signal",
    "mac-10_pipe_down",
    "g3sg1_scavenger",
    "m4a4_magnesium",
    "glock-18_oxide_blaze",
    "tec-9_fubar",
    "mp9_modest_threat",
    "sg553_danger_close",
    "sawed-off_black_sand",
    "nova_wood_fired"
  ]
  
  const skinsFormatted = [
    "Desert Eagle | Mecha Industries",
    "UMP-45 | Momentum",
    "MP5-SD | Phosphor",
    "USP-S | Flashback",
    "P250 | Nevermore",
    "Galil AR | Signal",
    "MAC-10 | Pipe Down",
    "G3SG1 | Scavenger",
    "M4A4 | Magnesium",
    "Glock-18 | Oxide Blaze",
    "Tec-9 | Fubar",
    "MP9 | Modest Threat",
    "SG553 | Danger Close",
    "Sawed-Off | Black Sand",
    "Nova | Wood Fired"
  ]

  const pricesOfSkins = {
    "Desert Eagle | Mecha Industries (Well-Worn)": 5.08,
    "Desert Eagle | Mecha Industries (Battle-Scarred)": 4,

    "MP5-SD | Phosphor (Well-Worn)": 3.27,
    "MP5-SD | Phosphor (Battle-Scarred)": 2.9,

    "UMP-45 | Momentum (Factory New)": 6.34,
    "UMP-45 | Momentum (Minimal Wear)": 4.28,
    "UMP-45 | Momentum (Field-Tested)": 3.07,
    "UMP-45 | Momentum (Well-Worn)": 3,
    "UMP-45 | Momentum (Battle-Scarred)": 3.11,

    "USP-S | Flashback (Factory New)": 1.1,
    "USP-S | Flashback (Minimal Wear)": 0.81,
    "USP-S | Flashback (Field-Tested)": 0.69,
    "USP-S | Flashback (Well-Worn)": 0.99,
    "USP-S | Flashback (Battle-Scarred)": 1.11,

    "P250 | Nevermore (Factory New)": 0.93,
    "P250 | Nevermore (Minimal Wear)": 0.61,
    "P250 | Nevermore (Field-Tested)": 0.41,
    "P250 | Nevermore (Well-Worn)": 0.55,
    "P250 | Nevermore (Battle-Scarred)": 0.55,

    "Galil AR | Signal (Factory New)": 0.92,
    "Galil AR | Signal (Minimal Wear)": 0.59,
    "Galil AR | Signal (Field-Tested)": 0.39,
    "Galil AR | Signal (Well-Worn)": 0.40,
    "Galil AR | Signal (Battle-Scarred)": 0.40,

    "MAC-10 | Pipe Down (Factory New)": 1.2,
    "MAC-10 | Pipe Down (Minimal Wear)": 0.6,
    "MAC-10 | Pipe Down (Field-Tested)": 0.39,
    "MAC-10 | Pipe Down (Well-Worn)": 0.34,
    "MAC-10 | Pipe Down (Battle-Scarred)": 0.32,

    "G3SG1 | Scavenger (Factory New)": 0.92,
    "G3SG1 | Scavenger (Minimal Wear)": 0.59,
    "G3SG1 | Scavenger (Field-Tested)": 0.38,
    "G3SG1 | Scavenger (Well-Worn)": 0.37,
    "G3SG1 | Scavenger (Battle-Scarred)": 0.32,

    "M4A4 | Magnesium (Factory New)": 1.58,
    "M4A4 | Magnesium (Minimal Wear)": 0.46,
    "M4A4 | Magnesium (Field-Tested)": 0.21,
    "M4A4 | Magnesium (Well-Worn)": 0.17,
    "M4A4 | Magnesium (Battle-Scarred)": 0.13,

    "Glock-18 | Oxide Blaze (Factory New)": 0.3,
    "Glock-18 | Oxide Blaze (Minimal Wear)": 0.12,
    "Glock-18 | Oxide Blaze (Field-Tested)": 0.09,
    "Glock-18 | Oxide Blaze (Well-Worn)": 0.14,
    "Glock-18 | Oxide Blaze (Battle-Scarred)": 0.09,

    "Tec-9 | Fubar (Factory New)": 0.65,
    "Tec-9 | Fubar (Minimal Wear)": 0.65,
    "Tec-9 | Fubar (Field-Tested)": 0.08,
    "Tec-9 | Fubar (Well-Worn)": 0.08,
    "Tec-9 | Fubar (Battle-Scarred)": 0.08,

    "MP9 | Modest Threat (Factory New)": 0.21,
    "MP9 | Modest Threat (Minimal Wear)": 0.12,
    "MP9 | Modest Threat (Field-Tested)": 0.08,
    "MP9 | Modest Threat (Well-Worn)": 0.10,
    "MP9 | Modest Threat (Battle-Scarred)": 0.09,

    "SG553 | Danger Close (Factory New)": 0.20,
    "SG553 | Danger Close (Minimal Wear)": 0.10,
    "SG553 | Danger Close (Field-Tested)": 0.08,
    "SG553 | Danger Close (Well-Worn)": 0.10,
    "SG553 | Danger Close (Battle-Scarred)": 0.07,

    "Sawed-Off | Black Sand (Factory New)": 0.2,
    "Sawed-Off | Black Sand (Minimal Wear)": 0.1,
    "Sawed-Off | Black Sand (Field-Tested)": 0.08,
    "Sawed-Off | Black Sand (Well-Worn)": 0.08,
    "Sawed-Off | Black Sand (Battle-Scarred)": 0.08,

    "Nova | Wood Fired (Factory New)": 0.17,
    "Nova | Wood Fired (Minimal Wear)": 0.10,
    "Nova | Wood Fired (Field-Tested)": 0.08,
    "Nova | Wood Fired (Well-Worn)": 0.09,
    "Nova | Wood Fired (Battle-Scarred)": 0.08
  }

  let i
  for (i = 0; i < amountOfDrops; i++) {
    let data = getWeapon('dangerZone')

    skin = data.skin
    skinCon = data.skinCon

    const conIndex = shorthandCondition.indexOf(skinCon)
    skinCon = conditions[conIndex] 

    const skinIndex = skins.indexOf(skin)
    skin = skinsFormatted[skinIndex]
    console.log(data.skin)

    const query = `${skin} (${skinCon})`

    price = pricesOfSkins[query]
    log(`${query} ${pricesOfSkins[query]}`)

    if (data.skinGrade !== 'mil_spec') {
      skinPrices += price
    }
    casesOpened++
  }

  caseIncome = casePrice * amountOfDrops

  return res.status(200).send({
    brojOtvorenihKutija: casesOpened,
    cijenaJedneKutijeKodNas: casePrice,
    sveukupnaZaradaOdProdavanjaKutijaEUR: caseIncome,
    sveukupnoIsplacenoSkinovaEUR: skinPrices,
    profitEUR: caseIncome - skinPrices
  })

  // res.send(querySkins)
  // return res.send(querySkins)

  // querySkins = [
  //   "Sawed-Off | Black Sand (Minimal Wear)", "Galil AR | Signal (Well-Worn)", "Nova | Wood Fired (Factory New)"
  // ]

  // let price = 0
  // try {
  //   price = await steamprice.getprices(730, "Sawed-Off | Black Sand (Minimal Wear)", '1')
  // } catch(err) {
  //   log(err)
  // }

  // res.status(200).send(price)

  // try {
  //   let price
  //   await Promise.all(querySkins.map(async (newQuery) => {
  //     price = await steamprice.getprices(730, "Sawed-Off | Black Sand (Minimal Wear)", '1')

  //     price = price[0].lowest_price
  //     price = price.substring(1)

  //     skinPrices += price
  //     casesOpened++
  //   }))

  //   caseIncome = casePrice * amountOfDrops

  //   res.status(200).send({
  //     casePrice,
  //     caseIncome,
  //     profit: caseIncome - casePrice,
  //     casesOpened
  //   })
  // } catch(err) {
  //   res.status(400).send(err)
  // }
})

// const wpnsFormatted = 
    // ['Desert Eagle', 'Dual Berettas', 'Five-SeveN', 'Glock-18',
    // 'CZ75-Auto', 'P2000', 'P250', 'R8 Revolver', 'Tec-9', 'USP-S',
    // 'MAG-7', 'Nova', 'Sawed-Off', 'XM1014', 'M249', 'Negev',
    // 'MAC-10',  'MP5-SD',  'MP7',  'MP9',  'P90',  'PP-Bizon',  'UMP-45',
    // 'AK-47', 'AUG', 'FAMAS', 'Galil AR', 'M4A1-S', 'M4A4', 'SG 553',
    // 'AWP', 'G3SG1', 'SCAR-20', 'SSG 08']

router.post('/request-trade', auth, async(req, res) => {
  const skinID = req.body.skinID

  try {
    await Skin.findByIdAndUpdate(skinID, {
      requestedTrade: true,
      tradeRequestedAt: new Date()
    })
  
    return res.status(200).send()
  } catch(err) {
    log(err)
    return res.status(400).send(err)
  }
})

function normalizeSkinName(skin, skinCon) {
  const skins = {
        "ak-47_asiimov": "AK-47 | Asiimov",
        "awp_neo-noir": "AWP | Neo-Noir",
        "desert_eagle_mecha_industries": "Desert Eagle | Mecha Industries",
        "mp5-sd_phosphor": "MP5-SD | Phosphor",
        "ump-45_momentum": "UMP-45 | Momentum",
        "usp-s_flashback": "USP-S | Flashback",
        "p250_nevermore": "P250 | Nevermore",
        "galil_ar_signal": "Galil AR | Signal",
        "mac-10_pipe_down": "MAC-10 | Pipe Down",
        "g3sg1_scavenger": "G3SG1 | Scavenger",
        "m4a4_magnesium": "M4A4 | Magnesium",
        "glock-18_oxide_blaze": "Glock-18 | Oxide Blaze",
        "tec-9_fubar": "Tec-9 | Fubar",
        "mp9_modest_threat": "MP9 | Modest Threat",
        "sg553_danger_close": "SG 553 | Danger Close",
        "sawed-off_black_sand": "Sawed-Off | Black Sand",
        "nova_wood_fired": "Nova | Wood Fired",
        "awp_asiimov": "AWP | Asiimov",
        "aug_chameleon": "AUG | Chameleon",
        "ak-47_redline": "AK-47 | Redline",
        "nova_antique": "Nova | Antique",
        "p90_trigon": "P90 | Trigon",
        "usp-s_guardian": "USP-S | Guardian",
        "sg_553_pulse": "SG 553 | Pulse",
        "mac-10_heat": "MAC-10 | Heat",
        "famas_sergeant": "FAMAS | Sergeant",
        "tec-9_sandstorm": "Tec-9 | Sandstorm",
        "negev_terrain": "Negev | Terrain",
        "mag-7_heaven_guard": "MAG-7 | Heaven Guard",
        "ump-45_corporal": "UMP-45 | Corporal",
        "m4a1-s_hyper_beast": "M4A1-S | Hyper Beast",
        "mac-10_neon_rider": "MAC-10 | Neon Rider",
        "galil_ar_eco": "Galil AR | Eco",
        "five-seven_monkey_business": "Five-SeveN | Monkey Business",
        "famas_djinn": "FAMAS | Djinn",
        "awp_worm_god": "AWP | Worm God",
        "mag-7_heat": "MAG-7 | Heat",
        "cz75-auto_pole_position": "CZ75-Auto | Pole Position",
        "ump-45_grand_prix": "UMP-45 | Grand Prix",
        "ak-47_elite_build": "AK-47 | Elite Build",
        "desert_eagle_bronze_deco": "Desert Eagle | Bronze Deco",
        "p250_valence": "P250 | Valence",
        "mp7_armor_core": "MP7 | Armor Core",
        "sawed-off_origami": "Sawed-Off | Origami",
        "negev_man-o-'war": "Negev | Man-o'-war",
        "desert_eagle_printstream": "Desert Eagle | Printstream",
        "ak-47_legion_of_anubis": "AK-47 | Legion of Anubis",
        "m4a4_toothfairy": "M4A4 | Tooth Fairy",
        "glock-18_vogue": "Glock-18 | Vogue",
        "xm1014_entombed": "XM1014 | Entombed",
        "mag-7_monster_call": "MAG-7 | Monster Call",
        "mac-10_allure": "MAC-10 | Allure",
        "tec-9_brother": "Tec-9 | Brother",
        "mp5-sd_kitbash": "MP5-SD | Kitbash",
        "galil_ar_connexion": "Galil AR | Connexion",
        "ssg_08_mainframe_001": "SSG 08 | Mainframe 001",
        "p250_cassette": "P250 | Cassette",
        "pp-bizon_runic": "PP-Bizon | Runic",
        "p90_freight": "P90 | Freight",
        "p2000_gnarled": "P2000 | Gnarled",
        "sg_553_ol'rusty": "SG 553 | Ol' Rusty",
        "negev_ultralight": "Negev | Ultralight",
        "m4a4_neo-noir": "M4A4 | Neo-Noir",
        "mp7_bloodsport": "MP7 | Bloodsport",
        "usp-s_cortex": "USP-S | Cortex",
        "awp_mortis": "AWP | Mortis",
        "aug_stymphalian": "AUG | Stymphalian",
        "glock-18_moonrise": "Glock-18 | Moonrise",
        "mag-7_swag-7": "MAG-7 | SWAG-7",
        "ump-45_artic_wolf": "UMP-45 | Arctic Wolf",
        "nova_wild_six": "Nova | Wild Six",
        "negev_lionfish": "Negev | Lionfish",
        "mp9_black_sand": "MP9 | Black Sand",
        "r8_revolver_grip": "R8 Revolver | Grip",
        "sg_553_aloha": "SG 553 | Aloha",
        "five-seven_flame_test": "Five-SeveN | Flame Test",
        "p2000_urban_hazard": "P2000 | Urban Hazard",
        "pp-bizon_night_riot": "PP-Bizon | Night Riot",
        "xm1014_oxide_blaze": "XM1014 | Oxide Blaze"
    }


  // condition
  const conditions = {
    "fn": "Factory New",
    "mw": "Minimal Wear",
    "ft": "Field-Tested",
    "ww": "Well-Worn",
    "bs": "Battle-Scarred"
  }

  const condition = conditions[skinCon]

  return `${skins[skin]} | (${condition})`
}

router.post('/view-trade-requests', async(req, res) => {
  const fetchSkinsSecret = req.body.fetchSkinsSecret

  if (fetchSkinsSecret !== process.env.FETCH_SKINS_SECRET) {
    throw new Error ('Unauthorized.')
  }

  try {
    const skins = await Skin.find({ requestedTrade: true },
      `_id skin condition userID`)

    let skinIDsForDeletion = []
    let skinsWTradeURL = []
    await Promise.all(skins.map(async (skin) => {
      const user = await User.findById(skin.userID, `-_id tradeURL`)
      
      let normalizedSkinName = normalizeSkinName(skin.skin, skin.condition)

      let skinWTradeURL = {
        skinID: skin._id,
        skinName: normalizedSkinName,
        tradeURL: user.tradeURL
      }
      
      skinIDsForDeletion.push(skin._id)
      skinsWTradeURL.push(skinWTradeURL)
    }))

    return res.status(200).send({ skinsWTradeURL, skinIDsForDeletion })
  } catch(err) {
    log(err)
    return res.status(400).send(err)
  }
})

router.post('/delete-skins', async(req, res) => {
  const fetchSkinsSecret = req.body.fetchSkinsSecret
  const skinIDs = req.body.skinIDsForDeletion

  if (fetchSkinsSecret !== process.env.FETCH_SKINS_SECRET) {
    throw new Error ('Unauthorized.')
  }

  try {
    await Promise.all(skinIDs.map(async (skinID) => {
      await Skin.deleteOne(skinID)
    }))

    res.status(200).send("Skinovi su izbrisani.")
  } catch(err) {
    res.status(400).send("Nešto si pogrešno unjeo.")
  }
})

function getSkinPrice(caseName, grade, condition) {
  const skinPrices = {
    "dangerZone": {
      "mil_spec": {
        "fn": 195,
        "mw": 110,
        "ft": 17,
        "ww": 15,
        "bs": 13
      },
      "restricted": {
        "fn": 270,
        "mw": 180,
        "ft": 120,
        "ww": 100,
        "bs": 90
      },
      "classified": {
        "ww": 950,
        "bs": 890
      }
    },
    "chroma2": {
      "mil_spec": {
        "fn": 60,
        "mw": 40,
        "ft": 30,
        "ww": 20,
        "bs": 15
      },
      "restricted": {
        "fn": 300,
        "mw": 160,
        "ft": 90,
        "ww": 60,
        "bs": 35
      },
      "classified": {
        "ww": 450,
        "bs": 325
      }
    },
    "clutch": {
      "mil_spec": {
        "fn": 35,
        "mw": 30,
        "ft": 25,
        "ww": 20,
        "bs": 15
      },
      "restricted": {
        "fn": 300,
        "mw": 160,
        "ft": 90,
        "ww": 80,
        "bs": 60
      },
      "classified": {
        "ww": 520,
        "bs": 500
      }
    },
    "fracture": {
      "mil_spec": {
        "fn": 100,
        "mw": 40,
        "ft": 30,
        "ww": 25,
        "bs": 20
      },
      "restricted": {
        "fn": 500,
        "mw": 320,
        "ft": 200,
        "ww": 130,
        "bs": 115
      },
      "classified": {
        "ww": 1800,
        "bs": 1600
      }
    },
    "phoenix": {
      "mil_spec": {
        "fn": 80,
        "mw": 60,
        "ft": 40,
        "ww": 30,
        "bs": 20
      },
      "restricted": {
        "fn": 750,
        "mw": 605,
        "ft": 320,
        "ww": 290,
        "bs": 230
      },
      "classified": {
        "ww": 1500,
        "bs": 1200
      }
    }
  }

  return skinPrices[caseName][grade][condition]
}

router.post('/sell-skin', auth, async(req, res) => {
  const skinID = req.body.skinID
  const userID = req.user._id

  try {
    const skin = await Skin.findById(skinID)

    const price = getSkinPrice(skin.caseName, skin.grade, skin.condition)

    await User.findByIdAndUpdate(userID, {
      $inc: {
        credits: price
      }
    })

    await User.findByIdAndUpdate(userID, {
      $pull: {
        skins: skinID
      }
    })

    await Skin.findByIdAndDelete(skinID)
  
    return res.status(200).send()
  } catch(err) {
    log(err)
    return res.status(400).send(err)
  }
})

module.exports = router