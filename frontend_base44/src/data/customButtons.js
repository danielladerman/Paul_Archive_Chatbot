// Optional, human-edited configuration for fully custom button labels
// and their associated chat questions per category.
//
// How to use:
// - Put your exact button text in `label`
// - Optionally specify a different `question` to send to chat
//   (defaults to `Tell me about ${label}` if omitted)
// - Fill arrays for any section you want to override; leave others empty.
//
// Categories:
// - LE (Life Events) with subcategories: C (Childhood), E (Education),
//   P (Professional), F (Family)
// - RAB (Rabbinical Activities)
// - TRB (Tributes)
// - JUD (Topics in Judaism)
// - PV (Paul's Viewpoints)
// - S&P (Social and Political Causes)
// - HIST (Historical Touchpoints)
//
// Example already enabled below for Childhood and Historical; edit freely.
export const CUSTOM_BUTTONS = {
  LE: {
    C: [
      { label: "Denver Childhood – Jewish Studies" },
      { label: "Denver Childhood – Growing Up on the Westside" },
      { label: "Denver Childhood – Growing Up in Children’s Paradise" },
      { label: "Denver Childhood – Early Life" },
      { label: "Childhood Story – Losing a Pocket Knife" },
      { label: "Living in Paris (1948–1949)" }
    ],
    E: [
      { label: "Studies at Merkaz HaRav Yeshiva, Jerusalem (1958)" }
    ],
    P: [
      { label: "Aliyah to Israel, Employment in Israel" },
      { label: "Creating an Open Hillel Institution in Berkely California 1971" },
      { label: "Director of Jewish Programming – Israel Association of Community Centers (1981)" },
      { label: "Director of Jewish Programming – Israel Association of Community Centers (1983)" },
      { label: "Director of Jewish Programming – Israel Association of Community Centers (1986)" },
      { label: "In moving to Israel Pivoting to becoming an Educator" },
      { label: "Master Career Timeline of Rabbi Paul Laderman" },
      { label: "Career Timeline" },
      { label: "USAF Chaplain Service 1960 to 1962" },
      { label: "Leading Youth Programs" },
    ],
    F: [
      { label: "Ancestry and Family Origins" },
      { label: "Paul's Correspondence with Parents in 1976" },
      { label: "Letters of Condolences" },
    ],
  },
  RAB: [
    { label: "Early Rabbinic Career" },
    { label: "Rabbinic Education and Training" },
    { label: "Officiating Wedding Ceremonies" },
    { label: "Reflections on the Biblical Book of Song of Songs" },
    { label: "Reflections on the Jewish Holiday of Purim" },
    { label: "Reflections on the Jewish Tu BiShvat Holiday – New Year for Flora" },
    { label: "Sermon for the Passover Holiday 1971" },
    { label: "Paul's thoughts on netilat yadayim (washing hands)" },
    { label: "Thoughts on the Ritual of Redeeming the First-Born Son (Pidyon HaBen)" },
    ],
  TRB: [
    { label: "Eulogy and Tribute by Rabbi Benji Segal" },
    { label: "Eulogy and Tribute by Rabbi Reuven Hammer" },
    { label: "Paul's Eulogy for Rabbi Manuel Laderman" },
    { label: "Kaddish Journey – Tribute by Zev Laderman" },
    { label: "Recognition for Youth Education Guidance" },
    { label: "Letter of Recognition from Tamra Community Center" },
    { label: "Condolence Letters: Gene Siskel & Sid Nowick" },
  ],
  JUD: [
    { label: "Yom Hashoah – Holocaust Memorial Day: An Interfaith Perspective" }
  ],
  PV: [
    { label: "Interfaith Peace Advocacy" },
    { label: "Reflections on Homosexuality and Jewish Halacha" },
    { label: "Reflections on Homosexuality and Jewish Halacha – A Response" },
    { label: "Reflections on Homosexuality and Jewish Halacha – Correspondence" },
    { label: "Humanitarian Cooperation – Article" },
    { label: "Paul's Perspectives on the First Palestinian Intifada (1989)" },
    { label: "Paul's Perspectives on Israel (1972)" },
    { label: "Thoughts on a Political Compormise for the West Bank 1988" },
    { label: "Perspectives on Jewish Religious Movements in Israel" },
    { label: "Paul's Thoughts on What Judaism Is in Israel – A Perspective" },
    { label: "Reflections on Returning to the USA" },
    { label: "Thoughts on The Rabbinc Leadership in the USA " },
    { label: "Perspective on Living in Israel" },
  ],
  "S&P": [
    { label: "Ethiopian Jewry – A Community’s Journey" },
    { label: "Opposition to California Governor Ronald Reagan (1970)" },
    { label: "Interactions with the Christian Order of Sisters of Kanaan" },
  ],
  HIST: [
    { label: "Modern American Jewry" },
    { label: "Post WW2 Europe Reconstruction" },
    { label: "UN Creation" },
    { label: "Creation of the State of Israel" },
    { label: "Interaction with Israeli and Jewish leader Giants" },
    { label: "Civil Rights" },
    { label: "SF in the 60s - Times of Change" },
    { label: "Vietnam Oposition - Berkeley" },
    { label: "Jewish Pluralism" },
    { label: "Chabad Early Mission days" },
    { label: "Yom Kippur War 1973" },
    { label: "Israel Social Change from Black Panther to the rise of Israel Community Centers" },
    { label: "Paul's Role in Israel Peace Movement & Progressiveness" },
    { label: "Paul's Role in Alternative Religious Political movement" },
    { label: "Ethiopian Jewry in Israel" },
    { label: "Chinese Jewry in Israel" },
  ],
};


