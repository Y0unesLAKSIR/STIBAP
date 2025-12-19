package ma.emsi.ai_question_generator.service;

import ma.emsi.ai_question_generator.dto.QuestionDTO;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class MockQuestionBank {

        public static List<QuestionDTO> getQuestions(String subject) {
                List<QuestionDTO> questions = new ArrayList<>();

                switch (subject) {
                        case "Java":
                                populateJava(questions);
                                break;
                        case "JEE":
                                populateJEE(questions);
                                break;
                        case "Python":
                                populatePython(questions);
                                break;
                        case "DotNet":
                                populateDotNet(questions);
                                break;
                        case "Web":
                                populateWeb(questions);
                                break;
                        case "Mobile":
                                populateMobile(questions);
                                break;
                        case "Cloud":
                                populateCloud(questions);
                                break;
                        case "AI":
                                populateAI(questions);
                                break;
                        case "Data Science":
                                populateDataScience(questions);
                                break;
                        case "DevOps":
                                populateDevOps(questions);
                                break;
                        case "Cybersecurity":
                                populateCybersecurity(questions);
                                break;
                        case "Database":
                                populateDatabase(questions);
                                break;
                        case "Networks":
                                populateNetworks(questions);
                                break;
                        case "Algorithms":
                                populateAlgorithms(questions);
                                break;
                        case "BigData":
                                populateBigData(questions);
                                break;
                        case "UML":
                                populateUML(questions);
                                break;
                        case "Maths_Adv":
                                populateMathsAdv(questions);
                                break;
                        case "Statistics":
                                populateStatistics(questions);
                                break;
                        case "Physics":
                                populatePhysics(questions);
                                break;
                        case "Chemistry":
                                populateChemistry(questions);
                                break;
                        case "Biology":
                                populateBiology(questions);
                                break;
                        case "Marketing":
                                populateMarketing(questions);
                                break;
                        case "Management":
                                populateManagement(questions);
                                break;
                        case "Accounting":
                                populateAccounting(questions);
                                break;
                        case "Economics":
                                populateEconomics(questions);
                                break;
                        case "Law":
                                populateLaw(questions);
                                break;
                        case "Audit":
                                populateAudit(questions);
                                break;
                        case "Communication":
                                populateCommunication(questions);
                                break;
                        case "English":
                                populateEnglish(questions);
                                break;
                        case "French":
                                populateFrench(questions);
                                break;
                        case "History":
                                populateHistory(questions);
                                break;
                        default:
                                populateGeneric(questions, subject);
                                break;
                }

                Collections.shuffle(questions);
                return questions.stream().limit(15).toList();
        }

        private static void add(List<QuestionDTO> list, String text, List<String> opts, int correct, String cat,
                        String diff, String expl) {
                QuestionDTO q = new QuestionDTO();
                q.setId((int) (Math.random() * 1000000));
                q.setText(text);
                q.setOptions(opts);
                q.setCorrectIndex(correct);
                q.setCategory(cat);
                q.setDifficulty(diff);
                q.setExplanation(expl);
                list.add(q);
        }

        // --- Populators ---

        private static void populateHistory(List<QuestionDTO> list) {
                add(list, "Who was the first President of the USA?",
                                List.of("George Washington", "Thomas Jefferson", "Abraham Lincoln", "John Adams"), 0,
                                "US History", "Easy", "Washington served from 1789 to 1797.");
                add(list, "When did WWII end?", List.of("1945", "1939", "1918", "1950"), 0, "World Wars", "Easy",
                                "Ended with Japanese surrender.");
                add(list, "Who built the Pyramids?", List.of("Egyptians", "Romans", "Greeks", "Mayans"), 0,
                                "Ancient History", "Easy", "Built as tombs for pharaohs.");
                add(list, "French Revolution start year?", List.of("1789", "1776", "1800", "1492"), 0,
                                "European History", "Medium", "Storming of the Bastille.");
                add(list, "Who wrote the Declaration of Independence?",
                                List.of("Thomas Jefferson", "Benjamin Franklin", "John Hancock", "Paul Revere"), 0,
                                "US History", "Medium", "Adopted on July 4, 1776.");
                add(list, "The Cold War was between?",
                                List.of("USA and USSR", "USA and China", "UK and Germany", "France and Russia"), 0,
                                "Modern History", "Easy", "Ideological conflict.");
                add(list, "Who is known as the Iron Lady?",
                                List.of("Margaret Thatcher", "Queen Elizabeth", "Angela Merkel", "Indira Gandhi"), 0,
                                "Leaders", "Medium", "British Prime Minister.");
                add(list, "The Berlin Wall fell in:", List.of("1989", "1991", "1980", "1975"), 0, "Modern History",
                                "Medium", "Symbolized the end of the Cold War.");
                add(list, "Who discovered America in 1492?",
                                List.of("Christopher Columbus", "Leif Erikson", "Amerigo Vespucci", "Magellan"), 0,
                                "Exploration", "Easy", "Sailed for Spain.");
                add(list, "The Industrial Revolution began in:", List.of("Britain", "USA", "France", "Germany"), 0,
                                "Economy", "Medium", "Started in the 18th century.");
                add(list, "Who was the Roman dictator assassinated in 44 BC?",
                                List.of("Julius Caesar", "Augustus", "Nero", "Caligula"), 0, "Ancient Rome", "Medium",
                                "Betrayed by the Senate.");
                add(list, "The Magna Carta was signed in:", List.of("1215", "1066", "1400", "1600"), 0, "Medieval",
                                "Hard", "Limited the King's power.");
                add(list, "Nelson Mandela was president of:", List.of("South Africa", "Nigeria", "Kenya", "Zimbabwe"),
                                0, "Modern History", "Easy", "Anti-apartheid revolutionary.");
                add(list, "The Titanic sank in:", List.of("1912", "1905", "1920", "1899"), 0, "Events", "Easy",
                                "Hit an iceberg.");
                add(list, "Who painted the Mona Lisa?", List.of("Da Vinci", "Michelangelo", "Raphael", "Van Gogh"), 0,
                                "Art History", "Easy", "Renaissance masterpiece.");
        }

        private static void populateEnglish(List<QuestionDTO> list) {
                add(list, "Which is a verb?", List.of("Run", "Blue", "Cat", "Quickly"), 0, "Grammar", "Easy",
                                "Action word.");
                add(list, "Plural of 'Child'?", List.of("Children", "Childs", "Childrens", "Kid"), 0, "Grammar", "Easy",
                                "Irregular plural.");
                add(list, "Synonym for 'Happy'?", List.of("Joyful", "Sad", "Angry", "Tired"), 0, "Vocabulary", "Easy",
                                "Similar meaning.");
                add(list, "Antonym of 'Big'?", List.of("Small", "Huge", "Large", "Giant"), 0, "Vocabulary", "Easy",
                                "Opposite meaning.");
                add(list, "Which sentence is correct?",
                                List.of("They're going home.", "Their going home.", "There going home.",
                                                "They going home."),
                                0, "Grammar", "Medium", "Contraction of 'They are'.");
                add(list, "Past tense of 'Go'?", List.of("Went", "Goed", "Gone", "Going"), 0, "Grammar", "Easy",
                                "Irregular verb.");
                add(list, "What is a metaphor?",
                                List.of("Direct comparison without 'like'", "Comparison using 'like'", "Exaggeration",
                                                "Sound comparison"),
                                0, "Devices", "Medium", "e.g., 'Time is a thief'.");
                add(list, "Who wrote 'Hamlet'?", List.of("Shakespeare", "Dickens", "Hemingway", "Austen"), 0,
                                "Literature", "Easy", "Famous playwright.");
                add(list, "Identify the adjective: 'The red car.'", List.of("Red", "The", "Car", "Is"), 0, "Grammar",
                                "Easy", "Describes a noun.");
                add(list, "What is a haiku?", List.of("3-line poem (5-7-5)", "Rhyming poem", "Long story", "Song"), 0,
                                "Literature", "Medium", "Japanese poetic form.");
                add(list, "'Break a leg' means:", List.of("Good luck", "Get hurt", "Run fast", "Stop"), 0, "Idioms",
                                "Medium", "Theatrical superstition.");
                add(list, "Correct spelling?", List.of("Receive", "Recieve", "Receve", "Riceive"), 0, "Spelling",
                                "Medium", "I before E except after C.");
                add(list, "What is a protagonist?", List.of("Main character", "Villain", "Narrator", "Author"), 0,
                                "Literature", "Medium", "Hero of the story.");
                add(list, "Superlative of 'Good'?", List.of("Best", "Better", "Goodest", "Great"), 0, "Grammar", "Easy",
                                "Good, Better, Best.");
                add(list, "Conjunction example?", List.of("And", "Run", "Ball", "Slowly"), 0, "Grammar", "Easy",
                                "Connects clauses.");
        }

        private static void populateAudit(List<QuestionDTO> list) {
                add(list, "Purpose of an external audit?",
                                List.of("Express opinion on financial statements", "Detect all fraud",
                                                "Prepare tax returns", "Manage company"),
                                0, "Basics", "Medium", "Independent verification.");
                add(list, "Who appoints the external auditor?", List.of("Shareholders", "CEO", "CFO", "Employees"), 0,
                                "Governance", "Medium", "Approved at AGM.");
                add(list, "What is 'Materiality'?",
                                List.of("Significance of misstatement", "Physical substance", "Paper quality", "Money"),
                                0, "Concepts", "Medium", "Impact on decision making.");
                add(list, "What is 'Internal Control'?", List.of("Processes to ensure objectives met", "Police check",
                                "Locking doors", "Staff monitoring"), 0, "Controls", "Easy", "Safeguards assets.");
                add(list, "What is a 'Qualified Opinion'?",
                                List.of("Financials fairly presented except for...", "Perfect financials",
                                                "Bad financials", "No opinion"),
                                0, "Reporting", "Hard", "Limited scope or specific issue.");
                add(list, "SOX stands for:",
                                List.of("Sarbanes-Oxley Act", "Standard Operational Xylophone", "System of X",
                                                "Sales Operation X"),
                                0, "Regulation", "Medium", "US federal law 2002.");
                add(list, "Which is NOT an audit assertation?",
                                List.of("Profitability", "Existence", "Completeness", "Accuracy"), 0, "Assertions",
                                "Hard", "Profitability is a metric, not an assertion.");
                add(list, "What is 'Substantive Testing'?",
                                List.of("Verifying actua balances/transactions", "Testing controls",
                                                "Interviewing staff", "Planning"),
                                0, "Procedures", "Medium", "Direct evidence gathering.");
                add(list, "What is 'Audit Risk'?",
                                List.of("Risk of wrong opinion", "Risk of losing job", "Risk of fraud",
                                                "Risk of lawsuit"),
                                0, "Risk", "Medium", "Auditor gives clean opinion on misstated financials.");
                add(list, "Big 4 audit firms include:",
                                List.of("Deloitte, PwC, EY, KPMG", "Google, Amazon, Apple, Facebook",
                                                "Chase, Citi, BOA, Wells", "Ford, GM, Toyota, Honda"),
                                0, "Industry", "Easy", "Major professional services networks.");
                add(list, "What is 'Going Concern'?",
                                List.of("Ability to continue operating", "A worried client", "Bankruptcy", "Shutdown"),
                                0, "Concepts", "Medium", "Company will survive next 12 months.");
                add(list, "Evidence must be:", List.of("Sufficient and Appropriate", "Loud and Clear", "Long and Short",
                                "Black and White"), 0, "Evidence", "Medium", "Quantity and Quality.");
                add(list, "What is a 'Walkthrough'?",
                                List.of("Tracing a transaction start to finish", "Walking in the office",
                                                "Touring the factory", "Leaving the job"),
                                0, "Procedures", "Medium", "Understanding flow.");
                add(list, "Independence means:",
                                List.of("Unbiased and objective", "Working alone", "Freelancing", "Rich"), 0, "Ethics",
                                "Easy", "Crucial for credibility.");
                add(list, "ISA stands for:",
                                List.of("International Standards on Auditing", "Internal System Audit",
                                                "International Space Agency", "Income Statement Analysis"),
                                0, "Standards", "Easy", "Global audit rules.");
        }

        private static void populateManagement(List<QuestionDTO> list) {
                add(list, "What is SWOT?", List.of("Strengths, Weaknesses, Opportunities, Threats",
                                "Sales, Work, Org, Time", "Strategy, W, O, T", "None"), 0, "Planning", "Easy",
                                "Strategic tool.");
                add(list, "Father of Scientific Management?",
                                List.of("Frederick Taylor", "Henry Ford", "Maslow", "Fayol"), 0, "Theory", "Medium",
                                "Efficiency focus.");
                add(list, "Maslow's Hierarchy is about?", List.of("Needs", "Money", "Time", "Production"), 0,
                                "Motivation", "Easy", "Psychological needs.");
                add(list, "What is 'Delegation'?", List.of("Assigning responsibility", "Firing", "Hiring", "Meeting"),
                                0, "Leadership", "Easy", "Passing tasks to others.");
                add(list, "SMART goals stands for:",
                                List.of("Specific, Measurable, Achievable, Relevant, Time-bound", "Small, M, A, R, T",
                                                "Strategy, M, A, R, T", "Simple, M, A, R, T"),
                                0, "Planning", "Medium", "Goal setting framework.");
                add(list, "What is 'Agile'?",
                                List.of("Iterative project management", "Running fast", "Gymnastics", "Rigid planning"),
                                0, "Methodology", "Medium", "Flexible approach.");
                add(list, "Theory X assume workers are:",
                                List.of("Lazy and dislike work", "Motivated", "Smart", "Leaders"), 0, "Theory", "Hard",
                                "McGregor's theory.");
                add(list, "What is 'Stakeholder'?", List.of("Anyone interested in the company", "Shareholder only",
                                "Customer only", "Butcher"), 0, "General", "Easy", "Employees, customers, community.");
                add(list, "What is 'Micro-management'?",
                                List.of("Excessive control", "Small management", "Efficient management", "Strategy"), 0,
                                "Leadership", "Easy", "Negative trait.");
                add(list, "What is 'Corporate Culture'?",
                                List.of("Shared values and practices", "Office layout", "Company logo", "Dress code"),
                                0, "Culture", "Medium", "The 'vibe' of the org.");
                add(list, "5 Functions of Management (Fayol)?", List.of("Plan, Organize, Command, Coordinate, Control",
                                "Buy, Sell, Trade, Hold, Profit", "Hire, Fire, Train, Pay, Promote", "None"), 0,
                                "Theory", "Hard", "Classic framework.");
                add(list, "What is 'Outsourcing'?",
                                List.of("Contracting work out", "Selling assets", "Hiring locally", "Exporting"), 0,
                                "Strategy", "Easy", "Using 3rd parties.");
                add(list, "What is 'Brainstorming'?", List.of("Generating ideas", "Headache", "Weather", "Criticizing"),
                                0, "Innovation", "Easy", "Creative technique.");
                add(list, "Matrix organization means:",
                                List.of("Dual reporting lines", "Virtual reality", "Hierarchical", "Flat"), 0,
                                "Structure", "Medium", "Reporting to function and project.");
                add(list, "What is 'KPI'?", List.of("Key Performance Indicator", "Key Person Interest",
                                "Keep People In", "Knowledge Power Index"), 0, "Metrics", "Easy",
                                "Measure of success.");
        }

        private static void populateFrench(List<QuestionDTO> list) {
                add(list, "Traduire 'Apple':", List.of("Pomme", "Poire", "Orange", "Banane"), 0, "Vocabulaire", "Easy",
                                "Fruit.");
                add(list, "Verbe 'Être' (Je):", List.of("Suis", "Es", "Est", "Sommes"), 0, "Grammaire", "Easy",
                                "I am.");
                add(list, "Pluriel de 'Cheval'?", List.of("Chevaux", "Chevals", "Chevales", "Chevaus"), 0, "Grammaire",
                                "Medium", "-al devient -aux.");
                add(list, "Qui a écrit 'Les Misérables'?", List.of("Victor Hugo", "Molière", "Zola", "Proust"), 0,
                                "Littérature", "Medium", "Roman célèbre.");
                add(list, "Féminin de 'Beau'?", List.of("Belle", "Beau", "Beaute", "Beelle"), 0, "Grammaire", "Easy",
                                "Adjectif.");
                add(list, "Le drapeau français est:", List.of("Bleu, Blanc, Rouge", "Hrouge, Blanc, Bleu",
                                "Vert, Blanc, Rouge", "Bleu, Jaune, Rouge"), 0, "Culture", "Easy", "Tricolore.");
                add(list, "Capitale de la France?", List.of("Paris", "Lyon", "Marseille", "Bordeaux"), 0, "Géographie",
                                "Easy", "Ville lumière.");
                add(list, "'Merci' veut dire:", List.of("Thanks", "Hello", "Goodbye", "Please"), 0, "Vocabulaire",
                                "Easy", "Politesse.");
                add(list, "Contraire de 'Grand'?", List.of("Petit", "Gros", "Large", "Haut"), 0, "Vocabulaire", "Easy",
                                "Taille.");
                add(list, "Imparfait de 'Aller' (Tu):", List.of("Allais", "Allas", "Iras", "Vas"), 0, "Conjugaison",
                                "Hard", "Passé.");
                add(list, "Molière était un:", List.of("Dramaturge", "Roi", "Peintre", "Soldat"), 0, "Culture",
                                "Medium", "Théâtre.");
                add(list, "Synonyme de 'Heureux'?", List.of("Content", "Triste", "Fâché", "Peureux"), 0, "Vocabulaire",
                                "Easy", "Joyeux.");
                add(list, "'S'il vous plaît' means:", List.of("Please", "Thank you", "Sorry", "Excuse me"), 0,
                                "Expressions", "Easy", "Polite request.");
                add(list, "Passé composé 'Manger' (Nous):",
                                List.of("Avons mangé", "Sommes mangé", "Mangions", "Mangeâmes"), 0, "Conjugaison",
                                "Medium", "Auxiliaire avoir.");
                add(list, "Le 'Roi Soleil' est:", List.of("Louis XIV", "Louis XVI", "Napoléon", "Charlemagne"), 0,
                                "Histoire", "Medium", "Versailles.");
        }

        // --- Sciences ---

        private static void populatePhysics(List<QuestionDTO> list) {
                add(list, "E = mc^2 is by:", List.of("Einstein", "Newton", "Bohr", "Tesla"), 0, "Relativity", "Easy",
                                "Mass-energy equivalence.");
                add(list, "Unit of Force?", List.of("Newton", "Joule", "Watt", "Pascal"), 0, "Units", "Easy", "N.");
                add(list, "Speed of light used symbol:", List.of("c", "l", "s", "v"), 0, "Constants", "Medium",
                                "c approx 3x10^8 m/s.");
                add(list, "Newton's First Law?", List.of("Inertia", "F=ma", "Action/Reaction", "Gravity"), 0,
                                "Mechanics", "Medium", "Object at rest stays at rest.");
                add(list, "Electron charge is:", List.of("Negative", "Positive", "Neutral", "Variable"), 0, "Particles",
                                "Easy", "-1.6e-19 C.");
                add(list, "Gravity on Earth?", List.of("9.8 m/s^2", "1.6 m/s^2", "100 m/s^2", "0"), 0, "Mechanics",
                                "Easy", "Acceleration g.");
                add(list, "What is a Photon?", List.of("Light particle", "Proton", "Neutron", "Atom"), 0, "Quantum",
                                "Medium", "Quantum of light.");
                add(list, "Ohm's Law?", List.of("V = IR", "F = ma", "E = mc^2", "P = IV"), 0, "Circuits", "Easy",
                                "Voltage, Current, Resistance.");
                add(list, "Unit of Energy?", List.of("Joule", "Newton", "Watt", "Volt"), 0, "Units", "Easy", "J.");
                add(list, "What is Kinetic Energy?", List.of("Energy of motion", "Stored energy", "Heat", "Light"), 0,
                                "Energy", "Easy", "0.5mv^2.");
                add(list, "Absolute Zero is:", List.of("-273.15 C", "0 C", "-100 C", "-459 F"), 0, "Thermodynamics",
                                "Medium", "0 Kelvin.");
                add(list, "Velocity is:", List.of("Vector", "Scalar", "Energy", "Force"), 0, "Kinematics", "Medium",
                                "Speed with direction.");
                add(list, "What measures current?", List.of("Ammeter", "Voltmeter", "Ruler", "Scale"), 0, "Tools",
                                "Easy", "Amperes.");
                add(list, "Sound cannot travel in:", List.of("Vacuum", "Water", "Air", "Steel"), 0, "Waves", "Medium",
                                "Needs a medium.");
                add(list, "Atomic nucleus contains:",
                                List.of("Protons and Neutrons", "Electrons", "Photons", "Nothing"), 0, "Atomic", "Easy",
                                "Center of atom.");
        }

        private static void populateBiology(List<QuestionDTO> list) {
                add(list, "Powerhouse of the cell?", List.of("Mitochondria", "Nucleus", "Ribosome", "Wall"), 0, "Cell",
                                "Easy", "Generates ATP.");
                add(list, "DNA stands for:",
                                List.of("Deoxyribonucleic Acid", "Dynamic New Acid", "Diverse Nuclear Acid", "None"), 0,
                                "Genetics", "Medium", "Genetic material.");
                add(list, "Photosynthesis process?",
                                List.of("Plants make food using sunlight", "Animals eat", "Breathing", "Sleeping"), 0,
                                "Botany", "Easy", "Converts light to chemical energy.");
                add(list, "Which blood cells fight infection?",
                                List.of("White blood cells", "Red blood cells", "Platelets", "Plasma"), 0, "Anatomy",
                                "Medium", "Immune system.");
                add(list, "Largest organ in human body?", List.of("Skin", "Liver", "Heart", "Brain"), 0, "Anatomy",
                                "Medium", "Covers the body.");
                add(list, "Number of chromosomes in humans?", List.of("46", "23", "90", "12"), 0, "Genetics", "Medium",
                                "23 pairs.");
                add(list, "Process of cell division?", List.of("Mitosis", "Fusion", "Fission", "Osmosis"), 0, "Cell",
                                "Medium", "Replication.");
                add(list, "Herbivores eat:", List.of("Plants", "Meat", "Everything", "Insects"), 0, "Ecology", "Easy",
                                "Plant eaters.");
                add(list, "Common cold is caused by:", List.of("Virus", "Bacteria", "Fungus", "Parasite"), 0, "Health",
                                "Easy", "Viral infection.");
                add(list, "What pumps blood?", List.of("Heart", "Lungs", "Brain", "Liver"), 0, "Anatomy", "Easy",
                                "Circulatory system.");
                add(list, "Darwin is famous for:", List.of("Theory of Evolution", "Gravity", "Relativity", "Cells"), 0,
                                "History", "Easy", "Natural Selection.");
                add(list, "Protein factories?", List.of("Ribosomes", "Lysosomes", "Vacuoles", "Golgi"), 0, "Cell",
                                "Hard", "Translate RNA.");
                add(list, "What is Osmosis?", List.of("Water movement across membrane", "Cell eating",
                                "Energy production", "DNA copy"), 0, "Transport", "Medium", "Diffusion of water.");
                add(list, "Which vitamin comes from sun?", List.of("Vitamin D", "Vitamin C", "Vitamin A", "Vitamin B"),
                                0, "Health", "Easy", "Synthesized in skin.");
                add(list, "XY chromosome means:", List.of("Male", "Female", "Bird", "Plant"), 0, "Genetics", "Medium",
                                "XX is female.");
        }

        private static void populateChemistry(List<QuestionDTO> list) {
                add(list, "Symbol for Water?", List.of("H2O", "CO2", "O2", "NaCl"), 0, "Formulas", "Easy",
                                "Two Hydrogen one Oxygen.");
                add(list, "pH of 7 is:", List.of("Neutral", "Acidic", "Basic", "Toxic"), 0, "Acids", "Easy",
                                "Water is neutral.");
                add(list, "Symbol for Gold?", List.of("Au", "Ag", "Fe", "Go"), 0, "Elements", "Medium", "Aurum.");
                add(list, "What is an Atom?", List.of("Smallest unit of matter", "A molecule", "A cell", "A compound"),
                                0, "Basics", "Easy", "Building block.");
                add(list, "Noble gases are:", List.of("Unreactive", "Highly reactive", "Metals", "Solids"), 0,
                                "Periodic Table", "Medium", "Full valence shell.");
                add(list, "Proton charge?", List.of("Positive", "Negative", "Neutral", "Zero"), 0, "Atomic", "Easy",
                                "+1.");
                add(list, "Covalent bond involves:",
                                List.of("Sharing electrons", "Transferring electrons", "Magnetic force", "Gravity"), 0,
                                "Bonding", "Medium", "Shared pair.");
                add(list, "Avogadro's number?", List.of("6.022 x 10^23", "3.14", "9.8", "100"), 0, "Moles", "Hard",
                                "Particles in a mole.");
                add(list, "Rust is:", List.of("Iron Oxide", "Gold", "Silver", "Plastic"), 0, "Reactions", "Easy",
                                "Oxidation.");
                add(list, "First element?", List.of("Hydrogen", "Helium", "Lithium", "Carbon"), 0, "Periodic Table",
                                "Easy", "Atomic number 1.");
                add(list, "What is an Isotope?",
                                List.of("Same protons, different neutrons", "Same mass", "Different element", "Ion"), 0,
                                "Atomic", "Medium", "Variation of element.");
                add(list, "Reaction releasing heat?", List.of("Exothermic", "Endothermic", "Nuclear", "Slow"), 0,
                                "Thermo", "Medium", "Releases energy.");
                add(list, "NaCl is:", List.of("Table Salt", "Sugar", "Bleach", "Water"), 0, "Compounds", "Easy",
                                "Sodium Chloride.");
                add(list, "Malleable means:", List.of("Can be hammered into shape", "Brittle", "Liquid", "Gas"), 0,
                                "Properties", "Medium", "Metal property.");
                add(list, "Gas to Liquid is:", List.of("Condensation", "Evaporation", "Melting", "Freezing"), 0,
                                "States", "Easy", "Phase change.");
        }

        private static void populateStatistics(List<QuestionDTO> list) {
                add(list, "What is the 'Mean'?", List.of("Average", "Middle value", "Most frequent", "Range"), 0,
                                "Basics", "Easy", "Sum divided by count.");
                add(list, "What is the 'Median'?", List.of("Middle value", "Average", "Most frequent", "Max"), 0,
                                "Basics", "Easy", "50th percentile.");
                add(list, "What is the 'Mode'?", List.of("Most frequent", "Average", "Middle", "Zero"), 0, "Basics",
                                "Easy", "Most common value.");
                add(list, "Probability range?", List.of("0 to 1", "-1 to 1", "0 to 100", "1 to 10"), 0, "Probability",
                                "Easy", "0% to 100%.");
                add(list, "What is 'Standard Deviation'?", List.of("Measure of spread", "Average", "Total", "Error"), 0,
                                "Variance", "Medium", "Dispersion from mean.");
                add(list, "Type I error is:", List.of("False Positive", "False Negative", "True Positive", "None"), 0,
                                "Hypothesis", "Hard", "Rejecting true null.");
                add(list, "Bell curve refers to:",
                                List.of("Normal Distribution", "Uniform Distribution", "Skewed", "Linear"), 0,
                                "Distributions", "Medium", "Gaussian.");
                add(list, "Correlation does not imply:", List.of("Causation", "Relation", "Linearity", "Data"), 0,
                                "Concepts", "Easy", "Key rule.");
                add(list, "P-value < 0.05 usually means:", List.of("Significant", "Not significant", "Wrong", "Big"), 0,
                                "Hypothesis", "Medium", "Reject Null.");
                add(list, "Sample vs Population?", List.of("Part vs Whole", "Whole vs Part", "Same", "None"), 0,
                                "Basics", "Easy", "Sample is subset.");
                add(list, "What is an Outlier?", List.of("Value far from others", "Average", "Median", "Error"), 0,
                                "Data", "Easy", "Extreme value.");
                add(list, "Linear Regression predicts:",
                                List.of("Relationship between variables", "Future", "Lottery", "Weather"), 0, "Models",
                                "Medium", "Line of best fit.");
                add(list, "Null Hypothesis (H0)?",
                                List.of("No effect/difference", "Effect exists", "Alternative", "Proof"), 0,
                                "Hypothesis", "Medium", "Default assumption.");
                add(list, "What is a 'Variable'?",
                                List.of("Characteristic that can change", "Constant", "Number", "Graph"), 0, "Basics",
                                "Easy", "Data point.");
                add(list, "Histogram shows:", List.of("Frequency distribution", "Time series", "Map", "Names"), 0,
                                "Charts", "Easy", "Bar chart of bins.");
        }

        private static void populateMathsAdv(List<QuestionDTO> list) {
                add(list, "Derivative of x^2?", List.of("2x", "x", "2", "x^3"), 0, "Calculus", "Medium", "Power rule.");
                add(list, "Integral of 1 dx?", List.of("x + C", "1", "0", "x^2"), 0, "Calculus", "Medium",
                                "Antiderivative.");
                add(list, "Value of Pi?", List.of("3.14159...", "3.0", "3.1", "3.5"), 0, "Constants", "Easy",
                                "Ratio of circumf to diam.");
                add(list, "Pythagorean theorem?", List.of("a^2 + b^2 = c^2", "a+b=c", "E=mc^2", "y=mx+b"), 0,
                                "Geometry", "Easy", "Right triangle.");
                add(list, "Square root of 64?", List.of("8", "6", "4", "32"), 0, "Arithmetic", "Easy", "8*8=64.");
                add(list, "What is a 'Matrix'?",
                                List.of("Rectangular array of numbers", "A movie", "A loop", "A circle"), 0, "Algebra",
                                "Medium", "Rows and columns.");
                add(list, "Limit as x->0 of 1/x?", List.of("Undefined (Infinity)", "0", "1", "-1"), 0, "Calculus",
                                "Hard", "Vertical asymptote.");
                add(list, "Solve: 2x = 10", List.of("x=5", "x=2", "x=20", "x=0"), 0, "Algebra", "Easy", "Divide by 2.");
                add(list, "What is a Prime Number?", List.of("Divisible only by 1 and itself", "Odd number",
                                "Even number", "Divisible by 2"), 0, "Number Theory", "Easy", "e.g., 2, 3, 5.");
                add(list, "Sum of angles in triangle?", List.of("180", "360", "90", "100"), 0, "Geometry", "Easy",
                                "Degrees.");
                add(list, "Log base 10 of 100?", List.of("2", "10", "1", "0"), 0, "Logarithms", "Medium", "10^2=100.");
                add(list, "What is 'i'?", List.of("Square root of -1", "1", "-1", "0"), 0, "Complex Numbers", "Hard",
                                "Imaginary unit.");
                add(list, "Formula for area of circle?", List.of("pi * r^2", "2 * pi * r", "l * w", "0.5 * b * h"), 0,
                                "Geometry", "Easy", "Area.");
                add(list, "Factorial of 3 (3!)?", List.of("6", "3", "9", "1"), 0, "Combinatorics", "Easy", "3*2*1.");
                add(list, "Sin(90) degrees?", List.of("1", "0", "0.5", "-1"), 0, "Trig", "Medium", "Unit circle.");
        }

        // --- Tech ---

        private static void populateJEE(List<QuestionDTO> list) {
                populateGeneric(list, "JEE", "Web", "Medium");
        }

        private static void populatePython(List<QuestionDTO> list) {
                populateGeneric(list, "Python", "Code", "Easy");
        }

        private static void populateDotNet(List<QuestionDTO> list) {
                populateGeneric(list, ".NET", "Code", "Medium");
        }

        private static void populateWeb(List<QuestionDTO> list) {
                populateGeneric(list, "Web Dev", "Web", "Easy");
        }

        private static void populateMobile(List<QuestionDTO> list) {
                populateGeneric(list, "Mobile", "Mobile", "Medium");
        }

        private static void populateCloud(List<QuestionDTO> list) {
                populateGeneric(list, "Cloud", "Ops", "Medium");
        }

        private static void populateAI(List<QuestionDTO> list) {
                populateGeneric(list, "AI", "ML", "Hard");
        }

        private static void populateDataScience(List<QuestionDTO> list) {
                populateGeneric(list, "Data Science", "Data", "Medium");
        }

        private static void populateDevOps(List<QuestionDTO> list) {
                populateGeneric(list, "DevOps", "Ops", "Medium");
        }

        private static void populateCybersecurity(List<QuestionDTO> list) {
                populateGeneric(list, "Cybersecurity", "Sec", "Hard");
        }

        private static void populateDatabase(List<QuestionDTO> list) {
                populateGeneric(list, "Database", "DB", "Medium");
        }

        private static void populateNetworks(List<QuestionDTO> list) {
                populateGeneric(list, "Networks", "Net", "Medium");
        }

        private static void populateAlgorithms(List<QuestionDTO> list) {
                populateGeneric(list, "Algorithms", "CS", "Hard");
        }

        private static void populateBigData(List<QuestionDTO> list) {
                populateGeneric(list, "BigData", "Data", "Hard");
        }

        private static void populateUML(List<QuestionDTO> list) {
                populateGeneric(list, "UML", "Design", "Easy");
        }

        private static void populateLaw(List<QuestionDTO> list) {
                add(list, "What is a 'Contract'?",
                                List.of("A legally binding agreement", "A friendly promise", "A government law",
                                                "A criminal record"),
                                0, "Contracts", "Easy", "A contract is an agreement enforceable by law.");
                add(list, "What is 'Tort Law'?",
                                List.of("Civil wrongs causing harm", "Criminal activities", "International treaties",
                                                "Tax regulations"),
                                0, "Torts", "Medium", "Tort law deals with civil wrongs that cause harm or loss.");
                add(list, "What does 'IP' stand for in law?",
                                List.of("Intellectual Property", "Internal Protocol", "Internet Privacy",
                                                "International Policy"),
                                0, "IP Law", "Easy", "IP refers to creations of the mind.");
                add(list, "Which of these is NOT a branch of public law?",
                                List.of("Contract Law", "Constitutional Law", "Administrative Law", "Criminal Law"), 0,
                                "Public vs Private", "Medium", "Contract law is private law between individuals.");
                add(list, "What is 'Habeas Corpus'?",
                                List.of("Protection against unlawful detention", "The right to remain silent",
                                                "Freedom of speech", "The right to bear arms"),
                                0, "Rights", "Hard", "Habeas corpus protects against arbitrary arrest.");
                add(list, "What is 'GDPR'?",
                                List.of("Data Protection Regulation", "Global Defense Protocol",
                                                "General Domestic Public Rule", "German Data Policy"),
                                0, "Privacy", "Medium", "GDPR protects data privacy in the EU.");
                add(list, "A 'Plaintiff' is:",
                                List.of("The person bringing a lawsuit", "The person being sued", "The judge",
                                                "The jury"),
                                0, "Legal Procedure", "Easy", "The plaintiff initiates the case.");
                add(list, "What is 'Negligence'?",
                                List.of("Failure to exercise reasonable care", "Intentional harm", "Breach of contract",
                                                "Theft"),
                                0, "Torts", "Medium", "Negligence is careless conduct causing harm.");
                add(list, "What is a 'Patent'?",
                                List.of("Right to exclude others from making an invention", "Copyright for books",
                                                "Trademark for logos", "Trade secret"),
                                0, "IP Law", "Medium", "Patents protect inventions.");
                add(list, "What is 'Double Jeopardy'?",
                                List.of("Being tried twice for the same crime", "Double taxation", "Two judges",
                                                "Two juries"),
                                0, "Criminal Law", "Medium",
                                "Double jeopardy prohibits multiple prosecutions for the same offense.");
                add(list, "What is 'Jurisdiction'?",
                                List.of("Authority to hear a case", "The jury's decision", "The lawyer's argument",
                                                "The police station"),
                                0, "Procedure", "Easy", "Jurisdiction is the official power to make legal decisions.");
                add(list, "What is a 'Misdemeanor'?",
                                List.of("A minor crime", "A serious felony", "A civil wrong", "A contract breach"), 0,
                                "Criminal Law", "Easy", "Misdemeanors are less serious than felonies.");
                add(list, "What is 'Liability'?",
                                List.of("Legal responsibility", "Ability to lie", "Likelihood of winning",
                                                "Lawyer's fee"),
                                0, "General", "Easy", "Liability means being responsible for something by law.");
                add(list, "What is a 'Subpoena'?",
                                List.of("Order to appear in court", "A type of sandwich", "A plea deal", "A fine"), 0,
                                "Procedure", "Medium", "A subpoena compels witness testimony.");
                add(list, "What does 'Pro Bono' mean?",
                                List.of("For the public good (free legal work)", "For profit", "Professional bonus",
                                                "Provisional bond"),
                                0, "Ethics", "Easy", "Pro bono work is done voluntarily without payment.");
        }

        private static void populateCommunication(List<QuestionDTO> list) {
                add(list, "What is 'Non-verbal Communication'?",
                                List.of("Body language and gestures", "Written words", "Spoken words", "Email"), 0,
                                "Basics", "Easy", "It includes facial expressions, posture, etc.");
                add(list, "What is 'Active Listening'?",
                                List.of("Fully concentrating on the speaker", "Hearing while talking",
                                                "Pretending to listen", "Ignoring the speaker"),
                                0, "Skills", "Medium", "Active listening involves understanding and responding.");
                add(list, "What is 'Public Relations'?",
                                List.of("Managing information flow to public", "Adding friends on Facebook",
                                                "Public speaking only", "Relation between family"),
                                0, "PR", "Medium", "PR manages the spread of info to the public.");
                add(list, "What is the 'Sender' in communication?",
                                List.of("The origin of the message", "The receiver", "The medium", "The feedback"), 0,
                                "Models", "Easy", "The sender initiates the communication.");
                add(list, "What is 'Feedback'?",
                                List.of("The receiver's response", "The noise", "The channel", "The context"), 0,
                                "Models", "Easy", "Feedback confirms the message was understood.");
                add(list, "What is a 'Communication Barrier'?",
                                List.of("Something interfering with message", "A wall", "A language", "A phone"), 0,
                                "Barriers", "Easy", "Barriers distort or block messages.");
                add(list, "What is 'Mass Media'?",
                                List.of("TV, Radio, Internet", "Face to face", "Whispering", "Letters"), 0, "Media",
                                "Easy", "Mass media reaches large audiences.");
                add(list, "Which is a 'Soft Skill'?", List.of("Communication", "Coding", "Accounting", "Welding"), 0,
                                "Skills", "Easy", "Communication is a key soft skill.");
                add(list, "What is 'Interpersonal Communication'?",
                                List.of("Between two or more people", "Self-talk", "Mass communication",
                                                "Computer talk"),
                                0, "Types", "Easy", "It happens between individuals.");
                add(list, "What is 'Encoding'?",
                                List.of("Converting thoughts to message", "Decoding message", "Sending email",
                                                "Writing code"),
                                0, "Models", "Medium", "Encoding puts ideas into a communicable form.");
                add(list, "What is 'Decoding'?",
                                List.of("Interpreting the message", "Creating the message", "Sending the message",
                                                "Blocking the message"),
                                0, "Models", "Medium", "Decoding is understanding the encoded message.");
                add(list, "What is 'Context'?",
                                List.of("The situation/environment", "The text content", "The contact list",
                                                "The contest"),
                                0, "Theory", "Medium", "Context shapes the meaning of the message.");
                add(list, "Which is Written Communication?", List.of("Email", "Phone call", "Meeting", "Video chat"), 0,
                                "Types", "Easy", "Emails are written.");
                add(list, "What is 'Empathy'?",
                                List.of("Understanding others' feelings", "Feeling sorry", "Apathy", "Sympathy"), 0,
                                "Emotional Intelligence", "Medium", "Empathy connects communicators.");
                add(list, "What is 'Persuasion'?", List.of("Influencing others", "Forcing others", "Lying", "Ignoring"),
                                0, "Influence", "Easy", "Persuasion aims to change attitudes or behaviors.");
        }

        private static void populateAccounting(List<QuestionDTO> list) {
                add(list, "Assets = Liabilities + ?", List.of("Equity", "Revenue", "Expenses", "Debt"), 0,
                                "Accounting Equation", "Easy", "The fundamental accounting equation.");
                add(list, "What is a 'Balance Sheet'?",
                                List.of("Snapshot of financial position", "Profit over time", "Cash flow statement",
                                                "Employee list"),
                                0, "Statements", "Medium", "Shows Assets, Liabilities, Equity at a point in time.");
                add(list, "What is 'Debits' and 'Credits'?",
                                List.of("Left and Right side of ledger", "Good and Bad", "In and Out", "Cash and Bank"),
                                0, "Double Entry", "Easy", "Debit is left, Credit is right.");
                add(list, "What is 'GAAP'?",
                                List.of("Generally Accepted Accounting Principles", "Global Asset Account Plan",
                                                "Government Audit Procedure", "General Account Policy"),
                                0, "Standards", "Medium", "GAAP are standard accounting rules.");
                add(list, "What is 'Depreciation'?",
                                List.of("Allocation of asset cost over time", "Loss of money", "Market value drop",
                                                "Theft"),
                                0, "Assets", "Medium", "Expensing an asset over its useful life.");
                add(list, "Which is a 'Current Asset'?", List.of("Cash", "Building", "Patent", "Land"), 0,
                                "Classification", "Easy", "Cash is liquid and current.");
                add(list, "What is 'Net Income'?",
                                List.of("Revenue minus Expenses", "Total Sales", "Gross Profit",
                                                "Assets minus Liabilities"),
                                0, "P&L", "Easy", "The bottom line profit.");
                add(list, "What is an 'Audit'?",
                                List.of("Examination of financial records", "Writing checks", "Firing employees",
                                                "Buying stocks"),
                                0, "Audit", "Easy", "Verification of financial statements.");
                add(list, "What is 'Revenue'?", List.of("Income from sales", "Cost of goods", "Profit", "Tax"), 0,
                                "P&L", "Easy", "Money earned from operations.");
                add(list, "What is 'COGS'?",
                                List.of("Cost of Goods Sold", "Cash on Goods Sale", "Company of Goods Sold",
                                                "Cost of Gross Sales"),
                                0, "P&L", "Medium", "Direct costs of producing goods.");
                add(list, "What is a 'Liability'?", List.of("Debt or obligation", "Asset", "Profit", "Expense"), 0,
                                "Elements", "Easy", "What the company owes.");
                add(list, "Which report shows Cash Flow?",
                                List.of("Statement of Cash Flows", "Balance Sheet", "Income Statement",
                                                "Equity Statement"),
                                0, "Statements", "Easy", "Tracks cash in and out.");
                add(list, "What is 'Accrual Basis'?",
                                List.of("Recording when earned/incurred", "Recording when cash paid",
                                                "Recording at year end", "Recording never"),
                                0, "Principles", "Hard", "Matches revenues and expenses to period.");
                add(list, "What is 'Equity'?",
                                List.of("Owner's claim on assets", "Loan from bank", "Employee salary", "Tax owed"), 0,
                                "Elements", "Medium", "Nue assets (Assets - Liabilities).");
                add(list, "What is a 'Ledger'?", List.of("Book of accounts", "A shelf", "A calculator", "A manager"), 0,
                                "Records", "Easy", "Where transactions are posted.");
        }

        private static void populateEconomics(List<QuestionDTO> list) {
                add(list, "What is 'GDP'?",
                                List.of("Gross Domestic Product", "Gross Domestic Profit", "Global Daily Price",
                                                "General Demand Product"),
                                0, "Macro", "Easy", "Total value of goods/services produced.");
                add(list, "What involves 'Supply and Demand'?",
                                List.of("Price determination", "Printing money", "Government voting", "War"), 0,
                                "Micro", "Easy", "Interaction determines market price.");
                add(list, "What is 'Inflation'?",
                                List.of("Rise in general price level", "Rise in value of money", "Decrease in jobs",
                                                "Decrease in stocks"),
                                0, "Macro", "Easy", "Money loses purchasing power.");
                add(list, "What is 'Opportunity Cost'?",
                                List.of("Value of next best alternative", "Price of a product", "Cost of production",
                                                "Lost money"),
                                0, "Concepts", "Medium", "What you give up to choose something.");
                add(list, "Who is the father of formulation Economics?",
                                List.of("Adam Smith", "Karl Marx", "John Keynes", "Einstein"), 0, "History", "Medium",
                                "Author of Wealth of Nations.");
                add(list, "What is 'Microeconomics'?",
                                List.of("Study of individuals/firms", "Study of whole economy", "Study of money",
                                                "Study of stock market"),
                                0, "Definition", "Easy", "Focuses on small units.");
                add(list, "What is a 'Monopoly'?",
                                List.of("Single seller market", "Two sellers", "Many sellers", "No sellers"), 0,
                                "Market Structure", "Easy", "One firm dominates.");
                add(list, "What is 'Fiscal Policy'?",
                                List.of("Government spending and tax", "Central bank interest rates",
                                                "Corporate strategy", "Tech regulation"),
                                0, "Policy", "Medium", "Managed by the government.");
                add(list, "What is 'Monetary Policy'?",
                                List.of("Control of money supply", "Taxation", "Trade deals", "Labor laws"), 0,
                                "Policy", "Medium", "Managed by Central Bank.");
                add(list, "What is a 'Recession'?",
                                List.of("Economic decline", "Economic boom", "High inflation", "New currency"), 0,
                                "Cycles", "Easy", "Period of reduced economic activity.");
                add(list, "What is 'Utility'?",
                                List.of("Satisfaction/Benefit", "A utility bill", "Electricity", "Tools"), 0, "Micro",
                                "Medium", "Measure of satisfaction.");
                add(list, "What is 'Equilibrium'?",
                                List.of("Supply equals Demand", "Price is high", "Price is low", "No trade"), 0,
                                "Market", "Medium", "State of balance.");
                add(list, "Which is a 'Capital' resource?",
                                List.of("Machines/Factories", "Forests", "Workers", "Ideas"), 0, "Factors", "Medium",
                                "Man-made goods used in production.");
                add(list, "What is 'Scarcity'?",
                                List.of("Unlimited wants, limited resources", "Too much money", "Not enough jobs",
                                                "Too many goods"),
                                0, "Concepts", "Easy", "The fundamental economic problem.");
                add(list, "What is 'Elasticity'?",
                                List.of("Responsiveness to price change", "Rubber band", "Production speed",
                                                "Money growth"),
                                0, "Micro", "Medium", "How demand/supply reacts to price.");
        }

        private static void populateMarketing(List<QuestionDTO> list) {
                add(list, "What is the 4P model in Marketing?", List.of("Product, Price, Place, Promotion",
                                "People, Process, Physical Evidence, Partners", "Planning, Performance, Profit, Power",
                                "Product, Price, Planning, Promotion"), 0, "Marketing Basics", "Easy",
                                "The 4Ps are the foundational model of marketing mix.");
                add(list, "Which concept focuses on long-term customer relationships?",
                                List.of("Transactional Marketing", "Relationship Marketing", "Direct Sales",
                                                "Mass Marketing"),
                                1, "Marketing Strategy", "Medium",
                                "Relationship marketing emphasizes customer retention and satisfaction.");
                add(list, "What does SEO stand for?",
                                List.of("Search Engine Optimization", "Sales Engine Operation",
                                                "Social Engagement Organization", "Site External Optimization"),
                                0, "Digital Marketing", "Easy",
                                "SEO is the practice of optimizing content to rank higher in search engines.");
                add(list, "What is a 'Target Market'?",
                                List.of("A specific group of consumers a business aims to serve",
                                                "The total population of a country", "A list of competitors",
                                                "The physical location of a store"),
                                0, "Targeting", "Easy",
                                "A target market is the specific group of customers most likely to buy the product.");
                add(list, "Which of the following is a 'Psychographic' segmentation variable?",
                                List.of("Age", "Lifestyle", "Gender", "Income"), 1, "Segmentation", "Medium",
                                "Psychographics involve personality, values, attitudes, interests, and lifestyles.");
                add(list, "SWOT analysis stands for:", List.of("Strengths, Weaknesses, Opportunities, Threats",
                                "Sales, Wealth, Operations, Targets", "Strategy, Work, Organization, Time",
                                "Systems, Wireless, Online, Technology"), 0, "Strategic Planning", "Medium",
                                "SWOT is a strategic planning technique used to identify key factors.");
                add(list, "In the AIDA model, what does the first 'A' stand for?",
                                List.of("Action", "Awareness (or Attention)", "Affinity", "Approval"), 1,
                                "Consumer Behavior", "Medium", "AIDA stands for Attention, Interest, Desire, Action.");
                add(list, "What is 'Brand Equity'?",
                                List.of("The value added to a product by its brand name",
                                                "The stock price of a company", "The total assets of a marketing team",
                                                "The cost of a logo design"),
                                0, "Branding", "Hard",
                                "Brand equity represents the value distinct from the product's physical attributes.");
                add(list, "Which pricing strategy involves setting a high initial price?",
                                List.of("Skimming", "Penetration", "Bundling", "Cost-plus"), 0, "Pricing Strategy",
                                "Hard", "Price skimming involves charging a high price initially to capture surplus.");
                add(list, "What is 'Content Marketing'?",
                                List.of("Creating valuable content to attract an audience", "Sending spam emails",
                                                "Placing ads on TV", "Cold calling customers"),
                                0, "Digital Marketing", "Easy",
                                "Content marketing focuses on creating relevant content to attract a defined audience.");
                add(list, "The 'Place' in the 4Ps refers to:",
                                List.of("Distribution channels", "The physical store only",
                                                "The location of the headquarters",
                                                "Where the product is manufactured"),
                                0, "Marketing Mix", "Easy", "Place determines how the product reaches the customer.");
                add(list, "What is NOT a stage in the Product Life Cycle?",
                                List.of("Introduction", "Growth", "Maturity", "Inflation"), 3, "Product Management",
                                "Medium", "Inflation is an economic term, not a PLC stage. Decline is the 4th stage.");
                add(list, "Which tool is used for email marketing automation?",
                                List.of("Mailchimp", "Photoshop", "Excel", "PowerPoint"), 0, "Digital Tools", "Easy",
                                "Mailchimp is a popular email marketing platform.");
                add(list, "What is 'Social Proof'?",
                                List.of("Influence exerted by others on our behavior", "A contract signed by partners",
                                                "Proof of identity on social media", "An algorithm for ranking posts"),
                                0, "Consumer Psychology", "Hard",
                                "Social proof allows people to assume the actions of others reflect correct behavior.");
                add(list, "ROI in marketing means:",
                                List.of("Return on Investment", "Reach on Internet", "Rate of Interest",
                                                "Risk of Inflation"),
                                0, "Metrics", "Easy", "ROI measures the profitability of an investment.");
        }

        private static void populateJava(List<QuestionDTO> list) {
                add(list, "What is JVM?",
                                List.of("Java Virtual Machine", "Java Variable Method", "Java Verified Model",
                                                "Just Virtual Mode"),
                                0, "Basics", "Easy", "JVM executes Java bytecode.");
                add(list, "Which keyword puts a class in a package?", List.of("package", "import", "class", "void"), 0,
                                "Syntax", "Easy", "package keyword defines namespace.");
                add(list, "Java is:", List.of("Object Oriented", "Procedural", "Functional only", "Database"), 0,
                                "Concepts", "Easy", "Java is primarily OOP.");
                add(list, "What is `static`?",
                                List.of("Belongs to class, not instance", "Cannot change", "Private", "Global"), 0,
                                "Keywords", "Medium", "Accessed via ClassName.");
                add(list, "Which collection allows duplicates?", List.of("List", "Set", "Map", "None"), 0,
                                "Collections", "Medium", "List allows duplicates.");
                add(list, "What is 'Polymorphism'?", List.of("One interface, many forms", "Multiple inheritance",
                                "Data hiding", "Encryption"), 0, "OOP", "Medium", "Core OOP concept.");
                add(list, "Which exception is unchecked?",
                                List.of("NullPointerException", "IOException", "SQLException", "Exception"), 0,
                                "Exceptions", "Medium", "RuntimeException subclasses are unchecked.");
                add(list, "What does `final` mean on a variable?",
                                List.of("Constant can't change", "Last variable", "Public", "Static"), 0, "Keywords",
                                "Easy", "Value cannot be reassigned.");
                add(list, "What is a 'Stream' in Java 8?",
                                List.of("Sequence of elements supporting execution", "File I/O", "Video stream",
                                                "Network packet"),
                                0, "Features", "Medium", "Functional processing of collections.");
                add(list, "Default value of int?", List.of("0", "null", "1", "-1"), 0, "Primitives", "Easy",
                                "Primitives have defaults.");
                add(list, "What is 'Garbage Collection'?", List.of("Auto memory management", "Deleting files",
                                "Closing connections", "Cleaning code"), 0, "JVM", "Medium", "Reclaims unused memory.");
                add(list, "Does Java support multiple inheritance of classes?",
                                List.of("No", "Yes", "Only for abstract classes", "Sometimes"), 0, "OOP", "Medium",
                                "Diamond problem prevention.");
                add(list, "Entry point of Java app?", List.of("public static void main", "start()", "run()", "init()"),
                                0, "Basics", "Easy", "Standard main method.");
                add(list, "Which is NOT a primitive?", List.of("String", "int", "boolean", "char"), 0, "Types", "Easy",
                                "String is a Class.");
                add(list, "What is `super`?", List.of("Reference to parent class", "Super power", "Top level", "Admin"),
                                0, "Inheritance", "Easy", "Calls parent methods/constructor.");
        }

        private static void populateGeneric(List<QuestionDTO> list, String subject, String cat, String diff) {
                // Fallback for tech if not fully implemented in this massive file yet,
                // to avoid compiling errors or empty lists.
                // We implemented major ones above. The user explicitly mentioned
                // Audit/English/History/Management/Sciences.
                // I have implemented those. The rest (Tech stack except Java) I am stubbing
                // with BETTER generics.
                for (int i = 1; i <= 15; i++) {
                        add(list, "Proficiency Question " + i + " regarding " + subject,
                                        List.of("Correct Concept A", "Incorrect B", "Incorrect C", "Incorrect D"), 0,
                                        cat, diff,
                                        "This topic (" + subject + ") tests your knowledge.");
                }
        }

        // Overload for old calls
        private static void populateGeneric(List<QuestionDTO> list, String subject) {
                populateGeneric(list, subject, "General", "Easy");
        }

}
