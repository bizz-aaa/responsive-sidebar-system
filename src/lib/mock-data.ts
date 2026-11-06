export const currentUser = { name: "EVANSI SEVERINI MKOMANGE", email: "ayoubzela@gmial.com", memberId: 237 };

export type Member = { id: number; name: string; department: string; year: number; residency: string; phone: string };
export const members: Member[] = [
  { id: 237, name: "Evansi Severini Mkomange", department: "Computer Science", year: 3, residency: "Hall 2", phone: "0712 345 678" },
  { id: 238, name: "Neema Joseph", department: "Education", year: 2, residency: "Mabibo Hostel", phone: "0754 111 222" },
  { id: 239, name: "Baraka Mwakyusa", department: "Engineering", year: 4, residency: "Off-campus", phone: "0767 333 444" },
  { id: 240, name: "Rehema Shayo", department: "Economics", year: 1, residency: "Hall 5", phone: "0713 555 666" },
  { id: 241, name: "Daniel Kimaro", department: "Law", year: 2, residency: "Magufuli Hostel", phone: "0688 777 888" },
  { id: 242, name: "Grace Mollel", department: "Medicine", year: 3, residency: "Hall 1", phone: "0745 999 000" },
];

export type Contribution = { id: number; member: string; type: "Tithe" | "Offering" | "Special Project" | "Contribution"; amount: number; date: string };
export const contributions: Contribution[] = [
  { id: 1, member: "Neema Joseph", type: "Tithe", amount: 20000, date: "2026-11-01" },
  { id: 2, member: "Baraka Mwakyusa", type: "Offering", amount: 5000, date: "2026-11-01" },
  { id: 3, member: "Grace Mollel", type: "Special Project", amount: 50000, date: "2026-10-28" },
  { id: 4, member: "Daniel Kimaro", type: "Contribution", amount: 10000, date: "2026-10-25" },
  { id: 5, member: "Evansi Severini Mkomange", type: "Tithe", amount: 15000, date: "2026-10-25" },
];

export type CampusEvent = { id: number; title: string; date: string; time: string; venue: string; category: "Fellowship" | "Choir" | "Outreach" | "Concert"; registered: number };
export const events: CampusEvent[] = [
  { id: 1, title: "Kwa Upendo Grand Music Concert", date: "2026-12-06", time: "16:00", venue: "Mwenge SDA Church", category: "Concert", registered: 0 },
  { id: 2, title: "Friday Vespers Fellowship", date: "2026-11-06", time: "18:30", venue: "Nkrumah Hall", category: "Fellowship", registered: 42 },
  { id: 3, title: "Choir Practice", date: "2026-11-08", time: "14:00", venue: "Hall 2 Common Room", category: "Choir", registered: 18 },
  { id: 4, title: "Ubungo Community Outreach", date: "2026-11-15", time: "08:00", venue: "Ubungo Kisiwani", category: "Outreach", registered: 25 },
];

export const tzs = (n: number) => `TZS ${n.toLocaleString("en-US")}`;
