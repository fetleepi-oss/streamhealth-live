export interface QuizOption {
  id: 'A' | 'B' | 'C';
  optionNumber: 1 | 2 | 3;
  text: string;
  isOptimal: boolean;
  verdict: string;
  infectionEffect: number; // e.g. -50, +25, +40
  infectionEffectLabel: string; // e.g. "-50%", "+25%", "+40%"
  oneSentenceExplanation: string;
  consequence: string;
  epidemiologyDebrief: string;
}

export interface Scenario {
  id: string;
  number: number;
  title: string;
  category: string;
  pathogen: string;
  setting: string;
  narrative: string;
  image: string;
  initialCases: number;
  dayStart: number;
  dayEnd: number;
  options: QuizOption[];
  fieldTakeaway: string;
  whoReference: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'cholera-flooding',
    number: 1,
    title: 'Cholera Outbreak After Monsoon Flooding',
    category: 'Waterborne Epidemic',
    pathogen: 'Vibrio cholerae',
    setting: 'Displaced Persons Camp / River Delta',
    initialCases: 100,
    dayStart: 1,
    dayEnd: 10,
    narrative:
      'Torrential monsoon rains breached the municipal floodwalls, inundating informal settlements. 47 patients have presented within 24 hours with profuse watery diarrhea and profound dehydration; two children have collapsed in hypovolemic shock. Camp latrines were submerged, and displaced families are collecting drinking water from contaminated drainage swales. You are leading the emergency field response team.',
    image: '/src/assets/images/scenario_cholera_flooding_1793248444226.jpg',
    options: [
      {
        id: 'A',
        optionNumber: 1,
        text: 'Deploy decentralized Oral Rehydration Therapy (ORT) stations, distribute household water chlorination kits, and deliver emergency potable water tankers immediately.',
        isOptimal: true,
        verdict: 'Optimal Public Health Action',
        infectionEffect: -50,
        infectionEffectLabel: '-50%',
        oneSentenceExplanation:
          'Oral Rehydration Therapy and immediate water chlorination abruptly crush waterborne transmission chains and arrest fatal dehydration.',
        consequence:
          'Rapid ORT lowers cholera case fatality rate from 30%+ to under 0.5%. Safe chlorinated drinking water halts primary transmission chains.',
        epidemiologyDebrief:
          'Cholera mortality is driven almost entirely by rapid hypovolemic dehydration, not systemic bacterial invasion. The immediate cornerstone of management is aggressive rehydration using Oral Rehydration Salts (ORS) and IV Ringer\'s Lactate for shock, paired with point-of-use water disinfection (chlorine residual ≥0.5 mg/L).'
      },
      {
        id: 'B',
        optionNumber: 2,
        text: 'Administer broad-spectrum prophylactic oral antibiotics to all 2,000 camp residents prior to clinical triage and clean water delivery.',
        isOptimal: false,
        verdict: 'Suboptimal & Hazardous Intervention',
        infectionEffect: 25,
        infectionEffectLabel: '+25%',
        oneSentenceExplanation:
          'Indiscriminate antibiotic prophylaxis breeds resistant bacterial strains while contaminated water continues infecting camp residents unchecked.',
        consequence:
          'Mass unselective chemoprophylaxis accelerates antimicrobial resistance without protecting dehydrated children, while contaminated water sources continue infecting residents daily.',
        epidemiologyDebrief:
          'WHO cholera outbreak guidelines strongly advise against mass chemoprophylaxis. Antibiotics are only adjuncts reserved for severe cases with severe dehydration, never as a substitute for clean water and oral fluid replacement.'
      },
      {
        id: 'C',
        optionNumber: 3,
        text: 'Prioritize city-wide insecticide fogging over stagnant floodwaters and quarantine all symptomatic patients in separate single-occupancy tents.',
        isOptimal: false,
        verdict: 'Ineffective & Resource-Diverting Error',
        infectionEffect: 40,
        infectionEffectLabel: '+40%',
        oneSentenceExplanation:
          'Insecticide spraying has zero effect on waterborne Vibrio cholerae, wasting critical hours while toxic flood runoff drives a surge.',
        consequence:
          'Insecticide fogging has zero effect on Vibrio cholerae (which is waterborne, not vector-borne). Quarantine tents deplete critical medical staff time without solving water contamination.',
        epidemiologyDebrief:
          'Vibrio cholerae is transmitted via the fecal-oral route through contaminated water and food. Vector control does not alter transmission. Centralized cholera treatment centers (CTCs) with specialized cholera cots, not isolated single-person quarantines, optimize barrier nursing.'
      }
    ],
    fieldTakeaway:
      'In waterborne outbreaks, immediate hydration saves lives within hours, while safe water WASH (Water, Sanitation & Hygiene) interventions extinguish the epidemic curve.',
    whoReference: 'WHO Global Task Force on Cholera Control (GTFCC) Emergency Guidelines'
  },
  {
    id: 'measles-school',
    number: 2,
    title: 'Measles Cluster in an Elementary School',
    category: 'Airborne Aerosol Transmission',
    pathogen: 'Measles morbillivirus',
    setting: 'Urban Primary School (Ages 5–11)',
    initialCases: 80,
    dayStart: 11,
    dayEnd: 20,
    narrative:
      'A 7-year-old unimmunized pupil attended classes for 3 days while experiencing high fever, photophobia, cough, and runny nose, followed by a maculopapular rash spreading from the hairline downward. The school health registry reveals that 18% of kindergarten and 1st-grade pupils have non-medical vaccine exemptions. Measles virions remain viable suspended in indoor classroom air for up to 2 hours. This morning, 4 additional students report fever and conjunctivitis.',
    image: '/src/assets/images/scenario_measles_school_1793248444240.jpg',
    options: [
      {
        id: 'A',
        optionNumber: 1,
        text: 'Order a 24-hour campus closure to thoroughly bleach-scrub and spray disinfectant across student desks, chairs, and playground surfaces.',
        isOptimal: false,
        verdict: 'Misguided Fomite Focus',
        infectionEffect: 35,
        infectionEffectLabel: '+35%',
        oneSentenceExplanation:
          'Disinfecting desks fails against airborne droplet nuclei lingering in room air, leaving exposed pupils unprotected as cases multiply.',
        consequence:
          'Measles does not spread primarily through fomites or environmental surfaces. Deep cleaning desks leaves susceptible exposed children unprotected while the infectious incubation window closes.',
        epidemiologyDebrief:
          'Measles is one of the most infectious airborne respiratory viruses known (R₀ = 12–18). Transmission occurs via airborne droplet nuclei lingering in room air, not surface contact. Closing the school for surface scrubbing wastes the critical 72-hour window for post-exposure immunization.'
      },
      {
        id: 'B',
        optionNumber: 2,
        text: 'Identify unimmunized contacts for post-exposure MMR vaccination within 72 hours, mandate airborne isolation for symptomatic cases, and exclude unimmunized contacts for 21 days.',
        isOptimal: true,
        verdict: 'Optimal Public Health Action',
        infectionEffect: -60,
        infectionEffectLabel: '-60%',
        oneSentenceExplanation:
          'Post-exposure MMR immunization within 72 hours combined with a 21-day quarantine of susceptible pupils extinguishes aerosol transmission.',
        consequence:
          'Post-exposure MMR administered within 72 hours of first exposure prevents or attenuates clinical measles. Exclusion of susceptible contacts prevents explosive secondary spread.',
        epidemiologyDebrief:
          'CDC and public health outbreak protocols require rapid contact tracing: administer MMR vaccine within 72 hours (or Immunoglobulin within 6 days for high-risk individuals). Susceptible individuals without evidence of immunity must be excluded from group settings through 21 days following last exposure.'
      },
      {
        id: 'C',
        optionNumber: 3,
        text: 'Distribute pediatric vitamin C supplements and permit unimmunized students to attend normal classes provided they wear single-ply paper face coverings.',
        isOptimal: false,
        verdict: 'Suboptimal & High Risk of Outbreak Surge',
        infectionEffect: 55,
        infectionEffectLabel: '+55%',
        oneSentenceExplanation:
          'Porous cloth masks and vitamins cannot stop high-potency measles aerosols (R₀ 12–18), triggering an explosive community epidemic.',
        consequence:
          'Single-ply masks and supplements fail to stop airborne micro-droplet inhalation in indoor rooms. Secondary attack rates in susceptible household and classroom contacts approach 90%.',
        epidemiologyDebrief:
          'Because of its extraordinary aerosol transmissibility (R₀ > 12), partial barriers and general wellness supplements do not confer protective immunity. High vaccine coverage (≥95% population immunity) is the only proven defense against community measles resurgence.'
      }
    ],
    fieldTakeaway:
      'Measles moves via airborne suspension, not surfaces. When community immunity drops below 95%, rapid post-exposure prophylaxis within 72 hours and temporary exclusion are vital.',
    whoReference: 'CDC Manual for the Surveillance of Vaccine-Preventable Diseases: Measles'
  },
  {
    id: 'malaria-rainy-season',
    number: 3,
    title: 'Malaria Resurgence in the Rainy Season',
    category: 'Vector-Borne Transmission',
    pathogen: 'Plasmodium falciparum',
    setting: 'Sub-Saharan Agricultural Basin',
    initialCases: 120,
    dayStart: 21,
    dayEnd: 30,
    narrative:
      'Continuous seasonal downpours have expanded standing puddles, irrigation furrows, and discarded vehicle tires throughout agricultural villages. District clinics report a threefold increase in acute febrile illnesses accompanied by violent chills and prostration. Rapid Diagnostic Tests (RDTs) confirm Plasmodium falciparum in 78% of tested patients. Local pharmacies have exhausted their Artemisinin-based Combination Therapy (ACT) stock, and several infants are presenting with severe anemia.',
    image: '/src/assets/images/scenario_malaria_monsoon_1793248445166.jpg',
    options: [
      {
        id: 'A',
        optionNumber: 1,
        text: 'Emergency airlift Artemether-Lumefantrine (ACT) supplies to clinics, distribute mass Long-Lasting Insecticidal Nets (LLINs), and drain larval breeding puddles near homes.',
        isOptimal: true,
        verdict: 'Optimal Public Health Action',
        infectionEffect: -40,
        infectionEffectLabel: '-40%',
        oneSentenceExplanation:
          'Flooding clinics with artemisinin combination therapy and distributing insecticide-treated bed nets severs mosquito-to-human transmission.',
        consequence:
          'Immediate availability of first-line ACTs cures falciparum blood-stage parasites within 48–72 hours, preventing severe cerebral malaria and infant fatalities. LLINs disrupt night mosquito biting.',
        epidemiologyDebrief:
          'Integrated malaria control pairs prompt parasitological diagnosis with quality-assured Artemisinin-based Combination Therapy (ACT), coupled with vector interventions (LLIN universal coverage and targeted larval source management). This dual approach attacks both human reservoir transmission and vector density.'
      },
      {
        id: 'B',
        optionNumber: 2,
        text: 'Distribute oral chloroquine tablets across all adult community members indiscriminately without diagnostic testing to establish preventive chemical suppression.',
        isOptimal: false,
        verdict: 'Suboptimal & Drug-Resistance Disaster',
        infectionEffect: 20,
        infectionEffectLabel: '+20%',
        oneSentenceExplanation:
          'Blanket chloroquine administration is completely thwarted by widespread Plasmodium resistance, accelerating severe pediatric anemia.',
        consequence:
          'Widespread Plasmodium falciparum resistance renders chloroquine ineffective in this setting, causing clinical failure while giving families a false sense of protection.',
        epidemiologyDebrief:
          'Chloroquine resistance in Plasmodium falciparum is widespread globally. Blanket mass drug administration with an obsolete drug promotes toxicity and fails to treat life-threatening infections in children, while bypassing essential diagnostic verification.'
      },
      {
        id: 'C',
        optionNumber: 3,
        text: 'Instruct villagers that malaria is contracted by drinking untreated rainwater and mandate boiling drinking water while withholding modern pharmaceuticals.',
        isOptimal: false,
        verdict: 'Fatal Etiological Misconception',
        infectionEffect: 50,
        infectionEffectLabel: '+50%',
        oneSentenceExplanation:
          'Boiling drinking water does not prevent mosquito bites, causing untreated falciparum parasites to rapidly multiply into fatal cerebral malaria.',
        consequence:
          'Failing to treat Plasmodium falciparum malaria results in rapid progression to severe cerebral malaria, metabolic acidosis, and mortality in young children within 24 to 48 hours.',
        epidemiologyDebrief:
          'Malaria is exclusively transmitted through the bite of infective female Anopheles mosquitoes that inject sporozoites during blood feeds. It is not waterborne. Boiling water provides no antimalarial protection, and delaying artemisinin therapy in falciparum infections can be fatal.'
      }
    ],
    fieldTakeaway:
      'Seasonal vector surges demand immediate first-line artemisinin-based chemotherapy, universal bed-net barrier protection, and aggressive larval habitat suppression.',
    whoReference: 'WHO Guidelines for Malaria Vector Control and Case Management'
  }
];
