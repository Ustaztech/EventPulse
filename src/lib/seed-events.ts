import { Event } from './types';

const startAfterDays = (days: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const event = (
  id: string,
  title: string,
  description: string,
  categoryId: string,
  categoryName: string,
  categorySlug: string,
  categoryColor: string,
  days: number,
  hour: number,
  durationHours: number,
  venueName: string,
  organizerName: string,
  registeredCount: number,
): Event => {
  const start = startAfterDays(days, hour);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return {
    id,
    title,
    slug: id,
    description,
    categoryId,
    categoryName,
    categorySlug,
    categoryColor,
    organizerId: `demo-${categorySlug}`,
    organizerName,
    organizerContact: 'events@nsuk.edu.ng',
    targetAudience: 'UNIVERSITY_WIDE',
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    timezone: 'Africa/Lagos',
    format: 'PHYSICAL',
    venueName,
    campusArea: 'Main Campus, Keffi',
    address: `${venueName}, Nasarawa State University, Keffi`,
    restrictJoinLink: false,
    requiresRegistration: true,
    capacity: 300,
    registeredCount,
    status: 'PUBLISHED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const DEMO_EVENTS: Event[] = [
  event('nsuk-research-forum', 'Undergraduate Research & Innovation Forum', 'A campus-wide showcase of student research, practical prototypes, and fresh ideas, followed by a moderated discussion with faculty mentors.', 'cat-1', 'Academic', 'academic', '#1E40AF', 5, 10, 3, 'Senate Building Conference Hall', 'Office of Academic Planning', 86),
  event('nsuk-build-night', 'Build Night: From Idea to Working App', 'Join student developers for a guided evening of product design, web development, and short project demos. Bring a laptop and a team or come ready to meet one.', 'cat-2', 'Technology', 'technology', '#06B6D4', 8, 16, 4, 'Technology & Innovation Auditorium', 'NSUK Developer Community', 142),
  event('nsuk-career-studio', 'Career Studio: CVs, Interviews & Internship Search', 'Get practical feedback on your CV, rehearse common interview questions, and learn how to find and evaluate internship opportunities.', 'cat-4', 'Professional Development', 'professional-development', '#6366F1', 11, 11, 2, 'Postgraduate School Seminar Room A', 'Career Development Centre', 64),
  event('nsuk-campus-cup', 'Inter-Faculty Campus Cup', 'Support your faculty at an afternoon of friendly football, student commentary, and community. Spectators are welcome; team registration is limited.', 'cat-6', 'Sports', 'sports', '#10B981', 15, 14, 3, 'University Sports Complex Arena', 'NSUK Sports Council', 218),
  event('nsuk-culture-day', 'Many Cultures, One Campus', 'An open celebration of the languages, music, food, clothing, and stories represented across the NSUK community, with performances from student groups.', 'cat-7', 'Cultural', 'cultural', '#F59E0B', 19, 12, 4, '1000 Capacity Assembly Hall', 'Student Union Cultural Committee', 173),
  event('nsuk-climate-workshop', 'Sustainable Campus Design Workshop', 'Explore practical ways to improve campus energy use, waste reduction, and green spaces through short talks and collaborative design exercises.', 'cat-3', 'Workshops', 'workshops', '#0D9488', 23, 9, 3, 'Faculty of Science Main Lecture Theatre', 'Faculty of Natural & Applied Sciences', 51),
  event('nsuk-debate-open', 'NSUK Public Speaking & Debate Open', 'A welcoming debate showcase for first-time speakers and experienced teams. Learn the format, watch a live round, and join a short audience Q&A.', 'cat-1', 'Academic', 'academic', '#1E40AF', 27, 13, 3, 'Senate Building Conference Hall', 'NSUK Debate Society', 97),
];
