// Category labels (top-level); subcategories use a hyphen suffix, e.g., LE-C, LE-E, LE-F, LE-P
export const CATEGORY_LABELS = {
  LE: "Life Events, Family, and Community",
  RAB: "Rabbinical Activities and Teachings of Jewish Topics",
  PV: "Paul's Viewpoints",
  "S&P": "Social and Political Causes",
  TRB: "Tributes and Legacy"
  
};

export const CATEGORY_DESCRIPTIONS = {
  LE: "Major personal milestones and stages of life.",
  RAB: "Work, leadership, and teachings as a rabbi and an educator.",
  TRB: "Eulogies, memorials, honors, and insights into Rabbi Paul's special character.",
  PV: "Rabbi Paul’s personal views and perspectives.",
  "S&P": "Civic, social, and political engagement."
};

// Known title aliases -> canonical display names we prefer in the UI
export const TITLE_RENAMES = {
  "Childhood on Denver’s West Side": "Denver Childhood – Growing Up on the Westside",
  "Childhood on Denver's West Side": "Denver Childhood – Growing Up on the Westside",
  "Childhood in Denver & Torah Life": "Denver Childhood – Jewish Studies"
};

// Curated historical touchpoints (clickable -> asks the chatbot)
export const HISTORICAL_TOUCHPOINTS = [
  "Modern American Jewry",
  "Post WW2",
  "UN Creation",
  "Creation of Israel",
  "Interaction of Religions",
  "Civil Rights",
  "SF in the 60s",
  "Vietnam Opposition",
  "Jewish Professional Life",
  "Chabad Expansion",
  "Yom Kippur War",
  "Israel Social Fabric",
  "Israel Peace Processes",
  "Alternative Jewish Movements",
  "Ethiopian Jewry",
  "Chinese Jewry"
];

// Mapping from final display titles -> category code.
// NOTE: Titles should match what /content?mode=titles returns (after overrides).
// Unknown titles will automatically go to "Uncategorized" in the UI.
export const TITLE_TO_CATEGORY = {
  // Topics in Judaism
  "Yom Hashoah – Holocaust Memorial Day: An Interfaith Perspective": "JUD",
  "Reflections on the Biblical Book Song of Songs": "JUD",
  "Thoughts on Netilat Yadayim – Washing Hands Before a Meal": "JUD",
  "Reflections on a Tu BiShvat Seder – The Jewish New Year for Trees": "JUD",
  "Reflections on Tu BiShvat – The Jewish New Year for Trees": "JUD",
  "Sermon for the Passover Holiday (1971)": "JUD",
  // Aliases seen in UI
  "Origins and Theological Reflections on Netilat Yadayim": "JUD",
  "Rosh Hashana and Tu Bishvat Reflections": "JUD",

  // Life Events (LE top-level and subcategories)
  // Childhood (LE-C)
  "Denver Childhood – Jewish Studies": "LE-C",
  "Denver Childhood – Growing Up on the Westside": "LE-C",
  "Childhood on Denver's West Side": "LE-C",
  "Childhood on Denver’s West Side": "LE-C",
  "Childhood in Denver & Torah Life": "LE-C",
  "Denver Childhood – Early Life": "LE-C",
  "Childhood Story – Losing a Pocket Knife": "LE-C",
  "Living in Paris (1948–1949)": "LE-C",
  // Education (LE-E)
  // Professional (LE-P)
  "Career Timeline": "LE-P",
  "Key Events in the Life of Rabbi Paul S. Laderman": "LE-P",
  "Director of Jewish Programming – Israel Association of Community Centers (1981)": "LE-P",
  "Director of Jewish Programming – Israel Association of Community Centers (1983)": "LE-P",
  "Director of Jewish Programming – Israel Association of Community Centers (1986)": "LE-P",
  "Conclusion of Work with Israel Association of Community Centers": "LE-P",
  "Director of Jewish Programming – Israel Association of Community Centers (Conclusion)": "LE-P",
  // Family (LE-F)
  "Ancestry and Family Origins": "LE-F",
  "Early Life and Family Background of Rabbi Paul": "LE-F",
  // General LE
  "Perspectives on Living in Israel": "LE",
  "Life Summary from Azkara Memorial": "LE",
  "Life Timeline and Milestones": "LE",

  // Rabbinical Activities
  "Early Rabbinic Career (USA)": "RAB",
  "Rabbinic Education and Training": "RAB",
  "USAF Chaplaincy Service (1960–1962)": "RAB",
  "US Air Force Chaplaincy and Service Years": "RAB",
  "Officiating Wedding Ceremonies": "RAB",
  "Wedding Ceremonies and Secular Outreach": "RAB",
  "Israel Years & Rabbi-Educator Role": "RAB",

  // Tributes
  "Eulogy and Tribute by Rabbi Benji Segal": "TRB",
  "Memorial Service for Rabbi Manuel Laderman (1989)": "TRB",
  "Kaddish Journey – A Tribute by Zae Laderman": "TRB",
  "Eulogy and Tribute by Rabbi Reuven Hammer": "TRB",
  "Letters of Condolence": "TRB",
  "Condolence Letters: Gene Siskel & Sid Nowick": "TRB",
  "Recognition for Youth Education Guidance": "TRB",

  // Paul's Viewpoints
  "Creating an Open Hillel Institution in Berkeley, California (1971)": "PV",
  "Interfaith Peace Advocacy": "PV",
  "Reflections on Homosexuality and Jewish Halacha": "PV",
  "Reflections on Homosexuality and Jewish Halacha – A Response": "PV",
  "Reflections on Homosexuality and Jewish Halacha – Correspondence": "PV",
  "On Homosexuality: A Jewish Reaction to a Developing Christian Attitude": "PV",
  "Humanitarian Cooperation – Article": "PV",
  "Humanitarian Cooperation, Not Political": "PV",
  "Binding Up the Wounds of the Intifada": "PV",
  "Perspectives on the First Palestinian Intifada (1989)": "PV",
  "Perspectives on Israel (1972)": "PV",
  "Rabbi Talking of Compromise on West Bank": "PV",
  "Perspectives on Jewish Religious Movements in Israel (1988)": "PV",
  "What Judaism Is in Israel – A Perspective": "PV",
  "Opposition to California Governor Ronald Reagan (1970)": "PV",
  "Reflections on Returning to the USA": "PV",
  "Letter of Recognition from Tamra Community Center": "PV",
  "Correspondence with Parents (1976)": "PV",

  // Social & Political Causes
  "Ethiopian Jewry – A Community’s Journey": "S&P",
  "Rabbi Is Passionately Linked to Ethiopian Jewry": "S&P",
  "Aliyah to Israel and Employment in Israel": "S&P",
  "Community Center Jewish Identity Initiative": "S&P",
  "Moving to Israel and Pivoting to Education": "S&P"
};


