import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const spirits = [
  // 岛01 - 普通词
  { id: 1,  word: 'apple',    islandId: 1, theme: 'home', difficulty: 1, phonetic: '/ˈæp.əl/',   meaningZh: '苹果',   exampleSentence: 'I eat an apple every day.',         isBoss: false },
  { id: 2,  word: 'book',     islandId: 1, theme: 'home', difficulty: 1, phonetic: '/bʊk/',       meaningZh: '书',     exampleSentence: 'She reads a book at night.',        isBoss: false },
  { id: 3,  word: 'cat',      islandId: 1, theme: 'home', difficulty: 1, phonetic: '/kæt/',       meaningZh: '猫',     exampleSentence: 'The cat sits on the mat.',          isBoss: false },
  { id: 4,  word: 'dog',      islandId: 1, theme: 'home', difficulty: 1, phonetic: '/dɒɡ/',       meaningZh: '狗',     exampleSentence: 'My dog likes to play fetch.',       isBoss: false },
  { id: 5,  word: 'elephant', islandId: 1, theme: 'home', difficulty: 2, phonetic: '/ˈel.ɪ.fənt/',meaningZh: '大象',   exampleSentence: 'The elephant is very big.',         isBoss: false },
  { id: 6,  word: 'family',   islandId: 1, theme: 'home', difficulty: 1, phonetic: '/ˈfæm.ə.li/', meaningZh: '家人',   exampleSentence: 'I love my family.',                isBoss: false },
  { id: 7,  word: 'garden',   islandId: 1, theme: 'home', difficulty: 2, phonetic: '/ˈɡɑːr.dən/', meaningZh: '花园',   exampleSentence: 'We grow flowers in the garden.',   isBoss: false },
  { id: 8,  word: 'house',    islandId: 1, theme: 'home', difficulty: 1, phonetic: '/haʊs/',      meaningZh: '房子',   exampleSentence: 'We live in a big house.',           isBoss: false },
  { id: 9,  word: 'kitchen',  islandId: 1, theme: 'home', difficulty: 2, phonetic: '/ˈkɪtʃ.ɪn/', meaningZh: '厨房',   exampleSentence: 'Mom cooks in the kitchen.',         isBoss: false },
  // 岛01 - BOSS
  { id: 100, word: 'home',    islandId: 1, theme: 'home', difficulty: 3, phonetic: '/hoʊm/',      meaningZh: '家',     exampleSentence: 'Home is where the heart is.',      isBoss: true  },
  // 岛02 - 普通词
  { id: 101, word: 'banana',  islandId: 2, theme: 'restaurant', difficulty: 1, phonetic: '/bəˈnæn.ə/',  meaningZh: '香蕉', exampleSentence: 'Monkeys love bananas.',              isBoss: false },
  { id: 102, word: 'bread',   islandId: 2, theme: 'restaurant', difficulty: 1, phonetic: '/bred/',       meaningZh: '面包', exampleSentence: 'We buy bread at the bakery.',       isBoss: false },
  { id: 103, word: 'cake',    islandId: 2, theme: 'restaurant', difficulty: 1, phonetic: '/keɪk/',       meaningZh: '蛋糕', exampleSentence: 'She baked a chocolate cake.',        isBoss: false },
  { id: 104, word: 'drink',   islandId: 2, theme: 'restaurant', difficulty: 1, phonetic: '/drɪŋk/',      meaningZh: '饮料', exampleSentence: 'What would you like to drink?',     isBoss: false },
  { id: 105, word: 'egg',     islandId: 2, theme: 'restaurant', difficulty: 1, phonetic: '/eɡ/',         meaningZh: '鸡蛋', exampleSentence: 'I have an egg for breakfast.',       isBoss: false },
  { id: 106, word: 'fish',    islandId: 2, theme: 'restaurant', difficulty: 1, phonetic: '/fɪʃ/',        meaningZh: '鱼',   exampleSentence: 'We eat fish on Fridays.',            isBoss: false },
  { id: 107, word: 'juice',   islandId: 2, theme: 'restaurant', difficulty: 1, phonetic: '/dʒuːs/',      meaningZh: '果汁', exampleSentence: 'I drink orange juice in the morning.',isBoss: false },
  { id: 108, word: 'milk',    islandId: 2, theme: 'restaurant', difficulty: 1, phonetic: '/mɪlk/',       meaningZh: '牛奶', exampleSentence: 'Children should drink milk daily.',  isBoss: false },
  { id: 109, word: 'orange',  islandId: 2, theme: 'restaurant', difficulty: 1, phonetic: '/ˈɒr.ɪndʒ/',  meaningZh: '橙子', exampleSentence: 'The orange is sweet and juicy.',     isBoss: false },
  // 岛02 - BOSS
  { id: 200, word: 'restaurant', islandId: 2, theme: 'restaurant', difficulty: 3, phonetic: '/ˈres.tər.ɒnt/', meaningZh: '餐厅', exampleSentence: 'We had dinner at a nice restaurant.', isBoss: true },
]

async function main() {
  console.log('Seeding spirits...')
  for (const spirit of spirits) {
    await prisma.spirit.upsert({
      where: { id: spirit.id },
      update: spirit,
      create: spirit,
    })
  }
  console.log(`Seeded ${spirits.length} spirits.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
