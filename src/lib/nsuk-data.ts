export interface NSUKCampusLocation {
  name: string;
  campus: string;
  building: string;
  address: string;
  landmark: string;
  lat: number;
  lng: number;
}

export const NSUK_CAMPUSES = [
  { id: 'main', name: 'Main Campus, Keffi', code: 'KEFFI-MAIN' },
  { id: 'pyanku', name: 'Pyanku Campus, Keffi', code: 'PYANKU' },
  { id: 'lafia', name: 'Lafia Campus', code: 'LAFIA' },
  { id: 'garki', name: 'Garki Campus, Abuja', code: 'GARKI' },
];

export const NSUK_FACULTIES = [
  {
    name: 'Faculty of Natural & Applied Sciences',
    departments: ['Computer Science', 'Biochemistry', 'Microbiology', 'Physics', 'Chemistry', 'Mathematics', 'Geology'],
  },
  {
    name: 'Faculty of Social Sciences',
    departments: ['Economics', 'Political Science', 'Sociology', 'Mass Communication', 'Psychology'],
  },
  {
    name: 'Faculty of Law',
    departments: ['Public Law', 'Private & Business Law', 'International Law'],
  },
  {
    name: 'Faculty of Agriculture',
    departments: ['Agronomy', 'Animal Science', 'Agricultural Economics', 'Fisheries'],
  },
  {
    name: 'Faculty of Administration',
    departments: ['Accounting', 'Business Administration', 'Public Administration', 'Banking & Finance'],
  },
  {
    name: 'Faculty of Arts',
    departments: ['English', 'History & International Studies', 'Theatre Arts', 'Languages & Linguistics', 'Religious Studies'],
  },
  {
    name: 'Faculty of Education',
    departments: ['Educational Foundations', 'Science & Technology Education', 'Arts & Social Science Education'],
  },
  {
    name: 'Faculty of Environmental Science',
    departments: ['Geography', 'Urban & Regional Planning', 'Architecture', 'Estate Management'],
  },
  {
    name: 'Faculty of Engineering',
    departments: ['Civil Engineering', 'Electrical & Electronics Engineering', 'Mechanical Engineering'],
  },
  {
    name: 'Faculty of Medical & Health Sciences',
    departments: ['Nursing Science', 'Medical Laboratory Science', 'Medicine & Surgery'],
  }
];

export const POPULAR_NSUK_VENUES: NSUKCampusLocation[] = [
  {
    name: '1000 Capacity Assembly Hall',
    campus: 'Main Campus, Keffi',
    building: 'Central Assembly Complex',
    address: 'Academic Core, Nasarawa State University, Keffi',
    landmark: 'Opposite Main Library Plaza',
    lat: 8.8486,
    lng: 7.8741
  },
  {
    name: 'Technology & Innovation Auditorium',
    campus: 'Main Campus, Keffi',
    building: 'Innovation Hub',
    address: 'Innovation Drive, Main Campus, Keffi',
    landmark: 'Adjacent to Senate Complex',
    lat: 8.8492,
    lng: 7.8755
  },
  {
    name: 'Faculty of Science Main Lecture Theatre',
    campus: 'Main Campus, Keffi',
    building: 'Science Block B',
    address: 'Science Quadrant, Main Campus, Keffi',
    landmark: 'Near Chemistry Research Lab',
    lat: 8.8475,
    lng: 7.8732
  },
  {
    name: 'Senate Building Conference Hall',
    campus: 'Main Campus, Keffi',
    building: 'Administrative Senate Tower',
    address: 'Senate Circle, Keffi',
    landmark: 'NSUK Gate A Entrance',
    lat: 8.8501,
    lng: 7.8760
  },
  {
    name: 'University Sports Complex Arena',
    campus: 'Main Campus, Keffi',
    building: 'Outdoor & Indoor Sports Center',
    address: 'Sports Village, Keffi Campus',
    landmark: 'Behind Student Hostel Block C',
    lat: 8.8450,
    lng: 7.8720
  },
  {
    name: 'Postgraduate School Seminar Room A',
    campus: 'Pyanku Campus, Keffi',
    building: 'PG Studies Building',
    address: 'Pyanku Road, Keffi',
    landmark: 'Old Campus Administrative Block',
    lat: 8.8390,
    lng: 7.8680
  }
];

export const CATEGORY_DEFINITIONS = [
  { name: 'Academic', slug: 'academic', color: '#1E40AF', icon: 'BookOpen', description: 'Lectures, symposia, research presentations, and thesis defenses.' },
  { name: 'Technology', slug: 'technology', color: '#06B6D4', icon: 'Code', description: 'Hackathons, coding workshops, AI seminars, and tech expos.' },
  { name: 'Workshops', slug: 'workshops', color: '#0D9488', icon: 'Wrench', description: 'Skill acquisition sessions, hands-on training, and bootcamps.' },
  { name: 'Professional Development', slug: 'professional-development', color: '#6366F1', icon: 'Briefcase', description: 'Career fairs, leadership summits, resume reviews, and networking.' },
  { name: 'Social', slug: 'social', color: '#EC4899', icon: 'PartyPopper', description: 'Freshers orientation, dinners, award nights, and talent shows.' },
  { name: 'Sports', slug: 'sports', color: '#10B981', icon: 'Trophy', description: 'Inter-faculty matches, marathons, indoor games, and fitness galas.' },
  { name: 'Cultural', slug: 'cultural', color: '#F59E0B', icon: 'Palette', description: 'Cultural days, carnival displays, drama performances, and heritage exhibitions.' },
  { name: 'Religious', slug: 'religious', color: '#8B5CF6', icon: 'HeartHandshake', description: 'Fellowship meetings, Ramadan lectures, worship nights, and interfaith dialogue.' }
];
