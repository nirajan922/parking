export const navigation = [
  { label: "Search Parking", href: "/parking/search" },
  { label: "Book Slot", href: "/bookings" },
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Contact", href: "/contact" },
];

export const parkingAreas = [
  {
    name: "Downtown Core",
    available: 128,
    capacity: 420,
    trend: "+18%",
    status: "High demand",
  },
  {
    name: "University Precinct",
    available: 64,
    capacity: 260,
    trend: "+9%",
    status: "Filling soon",
  },
  {
    name: "Riverside Station",
    available: 211,
    capacity: 360,
    trend: "-12%",
    status: "Open capacity",
  },
];

export const features = [
  {
    title: "Predictive availability engine",
    description:
      "Forecast occupancy by location, time of day, weather, events, and historical arrival patterns.",
    icon: "signal",
  },
  {
    title: "Real-time driver guidance",
    description:
      "Surface the best nearby spaces with confidence scores, walking distance, and expected turnover windows.",
    icon: "route",
  },
  {
    title: "Operator intelligence suite",
    description:
      "Equip parking teams with actionable dashboards for pricing, enforcement, and congestion reduction.",
    icon: "dashboard",
  },
  {
    title: "Demand-aware pricing",
    description:
      "Identify peak demand windows and align incentives with real-time capacity across high-traffic zones.",
    icon: "chart",
  },
  {
    title: "Event impact modelling",
    description:
      "Anticipate parking pressure from concerts, sports fixtures, classes, and commuter surges before they start.",
    icon: "calendar",
  },
  {
    title: "Mobile-first experience",
    description:
      "Deliver a crisp experience for field teams, executives, and drivers across desktop, tablet, and phone.",
    icon: "mobile",
  },
];

export const stats = [
  {
    value: "94%",
    label: "prediction confidence",
    description: "Across active city and campus zones",
  },
  {
    value: "31%",
    label: "less cruising time",
    description: "Reduced driver search loops",
  },
  {
    value: "8.4k",
    label: "spaces monitored",
    description: "Connected bays, meters, and lots",
  },
  {
    value: "24/7",
    label: "citywide insights",
    description: "Continuous occupancy intelligence",
  },
];

export const howItWorks = [
  {
    title: "Connect parking data",
    description:
      "Bring together sensors, meters, permit systems, camera counts, weather, events, and historical occupancy feeds.",
  },
  {
    title: "Predict demand shifts",
    description:
      "The model normalizes every signal into zone-level availability forecasts and confidence bands.",
  },
  {
    title: "Guide smarter action",
    description:
      "Publish recommendations to dashboards, driver apps, signage systems, and operations workflows.",
  },
];

export const dashboardMetrics = [
  { label: "Live occupancy", value: "68%", trend: "+12%" },
  { label: "Predicted openings", value: "342", trend: "45 min" },
  { label: "Avg. search time", value: "6.8m", trend: "-31%" },
];

export const zoneForecast = [
  { hour: "08", demand: "52%" },
  { hour: "09", demand: "74%" },
  { hour: "10", demand: "81%" },
  { hour: "11", demand: "69%" },
  { hour: "12", demand: "88%" },
  { hour: "13", demand: "76%" },
];
