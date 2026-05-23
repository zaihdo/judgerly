import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment')
  process.exit(1)
}

const supabase = createClient(url, key)

const quranCriteria = [
  { name: 'Memorization', weight: 30 },
  { name: 'Tajweed and Pronunciation', weight: 30 },
  { name: 'Tafseer', weight: 30 },
  { name: 'Fluency and Confidence', weight: 10 }
]

const hadeethCriteria = [
  { name: 'Memorization', weight: 30 },
  { name: 'Pronunciation', weight: 30 },
  { name: 'Understanding of the Hadeeth', weight: 30 },
  { name: 'Confidence and Presentation', weight: 10 }
]

const quranTracks = [
  { name: 'Level 1 (under 6)', participants: ['Abdulbasit sa\'ad','Abdullah sa\'ad','Mutmainnah Odukoya','Abdulrahman Ganiu-Asuni','Abdurrahman Akolawole Ayolo','Mohammed Adnan Sadiq','Mahamed','Elaph','Amjad','Waad','Mohamed Ibrahim Alnahhal','Taqwa Ameen'] },
  { name: 'Level 2 (under 8)', participants: ['Khadijah Sa\'ad','Muheenat Atoke Ayolo','Hamnah Tipagya Alhassan','Mayameen','Nabijah Ruqayyah Meher'] },
  { name: 'Level 3 (under 10)', participants: ['Ganiu-Asuni Mutmainnah','Sidrah Shaik','Maham khan','Arwa AlNahhal','Abrar Al-Nahhal','Mira Ahmad Deeb','Ahyan Irshad khan','Awab','Omer','AbdelRahman Ibrahim Alnahhal','Basma Ameen'] },
  { name: 'Level 4 (under 12)', participants: ['Abdulhaqq Ibrahim','Muhammad aayan','Mahira Humayun','Yakubu Halimat','AbdulBasit Folawiyo Ayolo','Hoar Alnahhal','Osama Alnahhal','Ahyan Irshad Khan','Amairah Pervin','Arafah Faisal'] },
  { name: 'Level 5 (under 13)', participants: ['Abdurrahman sa\'ad','Amina sa\'ad','Ameen Ibrahim','Jour Hammad','Mazen Hammad','Taim kdadu','Karim Elsayed','Youssef Elsayed','Fatema Saady','Mahmoud','Zein Halawik','Aya saady'] },
  { name: 'Level 6 (under 14)', participants: ['Ganiu-Asuni Mubarak','Yakubu Abdulmumin','Aya Saady'] },
  { name: 'Level 7 (under 15)', participants: ['Mutolib Ganiu-Asuni','Mehak','Hibah Naureen Sadiq','Aisha Ibrahim Al Nahhal','Saif Allah Ibrahim Alnahhal','Maher'] },
  { name: 'Level 8 (under 16)', participants: ['Yakubu Nazeer','Hussam Eddin Kadadou'] }
]

const hadeethTracks = [
  { name: 'Level 1 (under 6)', participants: ['Mutmainnah Odukoya','Mohammed Adnan Sadiq','Arwa AlNahhal','Abrar Al-Nahhal','Mahamed','Awab','Elaph','Amjad','Waad','Mohamed Ibrahim Alnahhal','Maher','Basma Ameen'] },
  { name: 'Level 2 (under 10)', participants: ['Ganiu-Asuni Mutmainnah','Amina sa\'ad','Mahira Humayun','Yakubu Halimat','Muheenat Atoke Ayolo','Hamnah Tipagya Alhassan','Hoar Alnahhal','Osama Alnahhal','Fatema Saady','Aya Saady','Mayameen','Amairah Pervin','Omer','AbdelRahman Ibrahim Alnahhal'] },
  { name: 'Level 3 (under 15)', participants: ['Ganiu-Asuni Mubarak','Mutolib Ganiu-Asuni','Sidrah Shaik','Yakubu Abdulmumin','Yakubu Nazeer','Hussam Eddin Kadadou','AbdulBasit Folawiyo Ayolo','Hibah Naureen Sadiq','Mahmoud','Zein Halawik','Aisha Ibrahim Al Nahhal','Saif Allah Ibrahim Alnahhal'] }
]

async function insert(table, data) {
  console.log(`  Inserting into ${table}:`, typeof data === 'object' && data.name ? data.name : JSON.stringify(data).slice(0, 60))
  const { data: result, error } = await supabase.from(table).insert(data).select().single()
  if (error) {
    console.error(`  ERROR inserting into ${table}:`, error.message)
    process.exit(1)
  }
  return result
}

async function seed() {
  console.log('=== Seeding Judgerly ===\n')

  console.log('1. Creating competition...')
  const competition = await insert('competitions', {
    name: '8th Quran Competition — Zul Hijja 1447 AH (2026)',
    password: 'judge2026'
  })
  console.log(`   Competition ID: ${competition.id}\n`)

  console.log('2. Creating Quran category...')
  const quranCat = await insert('categories', { competition_id: competition.id, name: 'Quran' })
  console.log(`   Quran category ID: ${quranCat.id}\n`)

  console.log('3. Inserting Quran tracks and participants...')
  for (const trackData of quranTracks) {
    const track = await insert('tracks', {
      category_id: quranCat.id,
      name: trackData.name,
      criteria: quranCriteria
    })
    console.log(`   Track: ${track.name} (${trackData.participants.length} participants)`)
    for (const pName of trackData.participants) {
      await insert('participants', { track_id: track.id, name: pName })
    }
  }
  console.log()

  console.log('4. Creating Hadeeth category...')
  const hadeethCat = await insert('categories', { competition_id: competition.id, name: 'Hadeeth' })
  console.log(`   Hadeeth category ID: ${hadeethCat.id}\n`)

  console.log('5. Inserting Hadeeth tracks and participants...')
  for (const trackData of hadeethTracks) {
    const track = await insert('tracks', {
      category_id: hadeethCat.id,
      name: trackData.name,
      criteria: hadeethCriteria
    })
    console.log(`   Track: ${track.name} (${trackData.participants.length} participants)`)
    for (const pName of trackData.participants) {
      await insert('participants', { track_id: track.id, name: pName })
    }
  }

  console.log('\n=== Seed complete! ===')
  console.log(`Competition ID: ${competition.id}`)
  console.log(`Password: judge2026`)
  console.log(`Judge URL: /judge`)
  console.log(`Results URL: /results/${competition.id}`)
}

seed()
