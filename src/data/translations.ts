export type Language = 'en' | 'am' | 'sw';

export interface TranslationStrings {
  appName: string;
  appSubtitle: string;
  educationalDisclaimer: string;
  liveVoting: string;
  votingClosed: string;
  startRound: string;
  closeVoting: string;
  showExplanation: string;
  hideExplanation: string;
  nextScenario: string;
  reopenVoting: string;
  simulateChat: string;
  simulateChatTooltip: string;
  activeCases: string;
  deathsAverted: string;
  communityTrust: string;
  epiCurveTitle: string;
  projectedWithoutAction: string;
  realHealthWorkers: string;
  sourcesTag: string;
  aiDebriefTitle: string;
  aiGrade6Tag: string;
  aiDebriefPrompt: string;
  leaderboardTitle: string;
  topRespondents: string;
  pts: string;
  streak: string;
  soundEffects: string;
  muted: string;
  unmuted: string;
  overlayMode: string;
  twitchChatInstructions: string;
  voteCommandHelp: string;
  scenarioNumber: string;
  ofTotal: string;
  summaryTitle: string;
  restartSimulation: string;
  autoAdvanceIn: string;
  paused: string;
  fieldProtocols: string;
}

export const TRANSLATIONS: Record<Language, TranslationStrings> = {
  en: {
    appName: 'StreamHealth Live',
    appSubtitle: 'Interactive Outbreak-Response Simulation for Twitch',
    educationalDisclaimer: 'Educational simulation, not medical advice.',
    liveVoting: 'Live Chat Voting',
    votingClosed: 'Voting Closed · Decision Locked',
    startRound: 'Start Round',
    closeVoting: 'Close Voting',
    showExplanation: 'Show Debrief',
    hideExplanation: 'Hide Debrief',
    nextScenario: 'Next Scenario',
    reopenVoting: 'Reopen Voting',
    simulateChat: 'Simulate Chat (50)',
    simulateChatTooltip: 'Adds 50 simulated viewer votes with realistic stagger',
    activeCases: 'Active Cases',
    deathsAverted: 'Deaths Averted',
    communityTrust: 'Community Trust',
    epiCurveTitle: 'Live Epidemic Curve (Epi-Curve)',
    projectedWithoutAction: 'Projected without intervention',
    realHealthWorkers: 'What Real Health Workers Do in the Field',
    sourcesTag: 'Evidence Sources: WHO & CDC Emergency Response Guidelines',
    aiDebriefTitle: 'AI Epidemiological Debrief',
    aiGrade6Tag: 'Grade-6 Public Health Briefing',
    aiDebriefPrompt: 'Explain why this choice helped or hurt in plain terms',
    leaderboardTitle: 'Incident Command Leaderboard',
    topRespondents: 'Top Field Responders',
    pts: 'pts',
    streak: 'streak',
    soundEffects: 'Sound FX',
    muted: 'Muted',
    unmuted: 'Sound On',
    overlayMode: 'OBS Overlay Mode',
    twitchChatInstructions: 'Vote in chat: type 1, 2, 3 or !1, !2, !3',
    voteCommandHelp: 'Anti-spam active · 1 vote/user · Last vote counts',
    scenarioNumber: 'Scenario',
    ofTotal: 'of',
    summaryTitle: 'Outbreak Response Mission Debrief',
    restartSimulation: 'Restart Outbreak Mission',
    autoAdvanceIn: 'Auto-advancing in',
    paused: 'Paused',
    fieldProtocols: 'Field Protocol Reference',
  },
  am: {
    appName: 'StreamHealth Live',
    appSubtitle: 'በTwitch ላይ የሚተላለፍ የህዝብ ጤና እና ወረርሽኝ መቆጣጠሪያ ማስመሰያ',
    educationalDisclaimer: 'የትምህርታዊ ማስመሰያ እንጂ የህክምና ምክር አይደለም።',
    liveVoting: 'የቀጥታ ድምጽ መስጫ',
    votingClosed: 'ድምጽ መስጠት ተዘግቷል · ውሳኔው ጸድቋል',
    startRound: 'ዙሩን ጀምር',
    closeVoting: 'ድምጽ መዝጊያ',
    showExplanation: 'ማብራሪያ አሳይ',
    hideExplanation: 'ማብራሪያ ደብቅ',
    nextScenario: 'ቀጣይ ሁኔታ',
    reopenVoting: 'ድምጽ እንደገና ክፈት',
    simulateChat: '50 ድምጾችን አስመስል',
    simulateChatTooltip: 'የ50 ተመልካቾችን ድምጽ በማስመሰል ያክላል',
    activeCases: 'ያሉ ታማሚዎች',
    deathsAverted: 'የዳኑ ህይወቶች',
    communityTrust: 'የህዝብ እምነት',
    epiCurveTitle: 'የቀጥታ የወረርሽኝ ኩርባ (Epi-Curve)',
    projectedWithoutAction: 'ያለ ጣልቃ ገብነት የሚገመት',
    realHealthWorkers: 'በእውነተኛ ሜዳ የጤና ባለሙያዎች የሚወስዱት እርምጃ',
    sourcesTag: 'የመረጃ ምንጭ፡ የአለም ጤና ድርጅት (WHO) እና ሲዲሲ (CDC)',
    aiDebriefTitle: 'የአይኤ ወረርሽኝ ትንታኔ',
    aiGrade6Tag: 'ቀላል የህዝብ ጤና ማጠቃለያ',
    aiDebriefPrompt: 'ውሳኔው ለምን እንደረዳ ወይም እንደጎዳ በግልጽ ያብራሩ',
    leaderboardTitle: 'የአመራር ደረጃ ሰንጠረዥ',
    topRespondents: 'ከፍተኛ ውጤት ያስመዘገቡ ተሳታፊዎች',
    pts: 'ነጥብ',
    streak: 'ተከታታይ',
    soundEffects: 'የድምፅ ቅንብር',
    muted: 'ድምጽ የለም',
    unmuted: 'ድምጽ በርቷል',
    overlayMode: 'የOBS ማሳያ ሁነታ',
    twitchChatInstructions: 'በቻት ድምጽ ይስጡ፡ 1, 2, 3 ወይም !1, !2, !3 ይጻፉ',
    voteCommandHelp: 'ፀረ-ስፓም በርቷል · አንድ ድምጽ ብቻ · የመጨረሻው ድምጽ ይቆጠራል',
    scenarioNumber: 'ሁኔታ',
    ofTotal: 'ከ',
    summaryTitle: 'የወረርሽኝ ተልእኮ ማጠቃለያ ሪፖርት',
    restartSimulation: 'ተልእኮውን እንደገና ጀምር',
    autoAdvanceIn: 'በራስ-ሰር የሚቀጥለው በ',
    paused: 'ለጊዜው ቆሟል',
    fieldProtocols: 'የሜዳ መመሪያ ማመሳከሪያ',
  },
  sw: {
    appName: 'StreamHealth Live',
    appSubtitle: 'Mchezo wa Kudhibiti Mlipuko wa Magonjwa kwa Mtiririko wa Twitch',
    educationalDisclaimer: 'Uigaji wa kielimu tu, sio ushauri wa kimatibabu.',
    liveVoting: 'Upigaji Kura Moja kwa Moja',
    votingClosed: 'Upigaji Kura Umefungwa · Uamuzi Umethibitishwa',
    startRound: 'Anza Raundi',
    closeVoting: 'Funga Upigaji Kura',
    showExplanation: 'Onyesha Ufafanuzi',
    hideExplanation: 'Ficha Ufafanuzi',
    nextScenario: 'Hali Inayofuata',
    reopenVoting: 'Fungua Tena Upigaji Kura',
    simulateChat: 'Iga Maoni ya Watazamaji (50)',
    simulateChatTooltip: 'Inaongeza kura 50 za mfano za watazamaji',
    activeCases: 'Wagonjwa Waliopo',
    deathsAverted: 'Vifo Vilivyozuiwa',
    communityTrust: 'Imani ya Jamii',
    epiCurveTitle: 'Mchoro wa Mwenendo wa Mlipuko (Epi-Curve)',
    projectedWithoutAction: 'Makadirio bila hatua yoyote',
    realHealthWorkers: 'Wafanyikazi Halisi wa Afya Hufanya Nini Ugani',
    sourcesTag: 'Vyanzo vya Ushahidi: Miongozo ya WHO na CDC',
    aiDebriefTitle: 'Ufafanuzi wa Akili Bandia (AI)',
    aiGrade6Tag: 'Muhtasari Rahisi wa Afya ya Umma',
    aiDebriefPrompt: 'Eleza kwa nini chaguo hili lilisaidia au kudhuru',
    leaderboardTitle: 'Ubao wa Viongozi wa Majibu',
    topRespondents: 'Washiriki Bora wa Ugani',
    pts: 'alama',
    streak: 'mfululizo',
    soundEffects: 'Sauti',
    muted: 'Imezimwa',
    unmuted: 'Sauti Imewashwa',
    overlayMode: 'Modi ya OBS ya Skrini',
    twitchChatInstructions: 'Piga kura kwenye gumzo: andika 1, 2, 3 au !1, !2, !3',
    voteCommandHelp: 'Ulinzi dhidi ya barua taka unatumika · Kura 1 kwa mtumiaji · Kura ya mwisho huhesabiwa',
    scenarioNumber: 'Hali ya Mlipuko',
    ofTotal: 'kati ya',
    summaryTitle: 'Tathmini Kamili ya Udhibiti wa Mlipuko',
    restartSimulation: 'Anzisha Tena Misheni',
    autoAdvanceIn: 'Inasonga mbele kiotomatiki baada ya',
    paused: 'Imesitishwa',
    fieldProtocols: 'Mwongozo wa Taratibu za Ugani',
  },
};
