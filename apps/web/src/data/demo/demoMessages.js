/**
 * Demo Chat Message Templates
 * Realistic conversations for each demo user, spanning ~90 days
 */

const DEMO_MESSAGE_TEMPLATES = {
  'demo-user-1': [ // Sarah - Graphic Designer, Art/Music/Travel/Photography
    { sender: 'them', content: 'Hey! I saw your response on the daily mission - loved your answer about travel', dayOffset: 85, hourOffset: 14 },
    { sender: 'me', content: 'Thanks! Your photography is amazing btw. Is that from your trip to Europe?', dayOffset: 85, hourOffset: 15.5 },
    { sender: 'them', content: 'Yes! That was in Barcelona. The architecture there is insane. Have you been?', dayOffset: 80, hourOffset: 10 },
    { sender: 'me', content: 'Not yet, it is on my bucket list. Any must-see spots for art lovers?', dayOffset: 80, hourOffset: 11 },
    { sender: 'them', content: 'Definitely Park Guell and the Gothic Quarter. Also this tiny gallery in El Born district', dayOffset: 72, hourOffset: 19 },
    { sender: 'me', content: 'A hidden art gallery? That sounds perfect', dayOffset: 72, hourOffset: 20 },
    { sender: 'them', content: 'I will send you the location when you go. Do you like visiting art exhibitions?', dayOffset: 60, hourOffset: 13 },
    { sender: 'me', content: 'Love them! I went to the Israel Museum last week actually', dayOffset: 60, hourOffset: 14.5 },
    { sender: 'them', content: 'Oh nice! I actually have a small exhibition coming up in Florentin next month', dayOffset: 45, hourOffset: 18 },
    { sender: 'me', content: 'That is awesome! I would love to come see your work', dayOffset: 45, hourOffset: 19 },
    { sender: 'me', content: 'Hey how is the exhibition prep going?', dayOffset: 30, hourOffset: 11 },
    { sender: 'them', content: 'Stressful but exciting! Opening night is next Friday. You should totally come', dayOffset: 30, hourOffset: 13 },
    { sender: 'me', content: 'Count me in! What time does it start?', dayOffset: 15, hourOffset: 16 },
    { sender: 'them', content: 'Doors open at 7 PM. It is at the Beit Kandinof gallery. See you there?', dayOffset: 15, hourOffset: 17 },
  ],
  'demo-user-2': [ // David - Software Engineer, Technology/Cooking/Hiking/History
    { sender: 'them', content: 'Hey! I noticed you also like hiking. Have you tried the trails near Ein Gedi?', dayOffset: 82, hourOffset: 9 },
    { sender: 'me', content: 'Yes! The waterfall trail is incredible. Do you go often?', dayOffset: 82, hourOffset: 10.5 },
    { sender: 'them', content: 'Try to go every other weekend. Last time I made shakshuka on a portable stove at the top', dayOffset: 75, hourOffset: 20 },
    { sender: 'me', content: 'Haha cooking while hiking? That is some next level commitment', dayOffset: 75, hourOffset: 21 },
    { sender: 'them', content: 'Tech by day, chef by night - it is in my bio for a reason', dayOffset: 65, hourOffset: 12 },
    { sender: 'me', content: 'Fair enough! What is the best thing you have cooked recently?', dayOffset: 65, hourOffset: 13 },
    { sender: 'them', content: 'Made fresh pasta from scratch last weekend. Took 3 hours but totally worth it', dayOffset: 50, hourOffset: 19 },
    { sender: 'me', content: 'Impressive. I can barely manage an omelette without burning it', dayOffset: 50, hourOffset: 20 },
    { sender: 'them', content: 'Everyone starts somewhere! I could share some easy recipes if you want', dayOffset: 35, hourOffset: 15 },
    { sender: 'me', content: 'That would be great actually. Maybe something simple to start?', dayOffset: 35, hourOffset: 16.5 },
    { sender: 'them', content: 'Hey, have you been to the new food market in Jerusalem? The spice section is incredible', dayOffset: 15, hourOffset: 11 },
    { sender: 'me', content: 'Not yet! Want to check it out together sometime?', dayOffset: 15, hourOffset: 12 },
    { sender: 'them', content: 'Definitely! How about this Saturday morning? Best time to go', dayOffset: 8, hourOffset: 18 },
    { sender: 'me', content: 'Sounds like a plan! See you there', dayOffset: 8, hourOffset: 19 },
  ],
  'demo-user-3': [ // Michael - Personal Trainer, Fitness/Nature/Sports/Movies
    { sender: 'them', content: 'Hey! Saw your profile - do you work out regularly?', dayOffset: 88, hourOffset: 7 },
    { sender: 'me', content: 'Trying to! Just started running a few months ago actually', dayOffset: 88, hourOffset: 9 },
    { sender: 'them', content: 'Nice! I run along the Haifa beach promenade almost every morning. It is the best', dayOffset: 78, hourOffset: 8 },
    { sender: 'me', content: 'That sounds amazing. How far do you usually go?', dayOffset: 78, hourOffset: 10 },
    { sender: 'me', content: 'Also saw you are into movies - seen anything good lately?', dayOffset: 68, hourOffset: 21 },
    { sender: 'them', content: 'Just watched the new thriller on Netflix - so good. You into action movies?', dayOffset: 68, hourOffset: 22 },
    { sender: 'them', content: 'If you ever want running tips, happy to help. It is literally my job haha', dayOffset: 55, hourOffset: 7 },
    { sender: 'me', content: 'Might take you up on that! My pace is kind of embarrassing though', dayOffset: 55, hourOffset: 8.5 },
    { sender: 'them', content: 'No judgment! Everyone starts somewhere. The beach at sunrise is beautiful too', dayOffset: 40, hourOffset: 6 },
    { sender: 'me', content: 'OK you convinced me. What time do you usually start your runs?', dayOffset: 30, hourOffset: 20 },
    { sender: 'them', content: '6 AM sharp - early bird gets the endorphins!', dayOffset: 30, hourOffset: 20.5 },
    { sender: 'them', content: 'Hey there is a group beach run this Saturday morning. Want to join?', dayOffset: 10, hourOffset: 18 },
    { sender: 'me', content: 'Sure why not! I will try to keep up with you guys', dayOffset: 10, hourOffset: 19 },
  ],
  'demo-user-4': [ // Maria - Medical Student, Dance/Medicine/Coffee/Reading
    { sender: 'them', content: 'Hi! Your daily mission response was so thoughtful. Do you always think that deeply about things?', dayOffset: 86, hourOffset: 22 },
    { sender: 'me', content: 'Haha I try. What are you studying? Your profile mentions something about med school', dayOffset: 86, hourOffset: 23 },
    { sender: 'them', content: 'Medicine at Ben-Gurion! Currently drowning in anatomy textbooks', dayOffset: 76, hourOffset: 21 },
    { sender: 'me', content: 'That sounds intense. How do you manage to unwind after all that studying?', dayOffset: 76, hourOffset: 22 },
    { sender: 'them', content: 'Dancing! Salsa and bachata mainly. It is the best stress relief ever', dayOffset: 66, hourOffset: 20 },
    { sender: 'me', content: 'I have always wanted to learn salsa. Is it hard to pick up?', dayOffset: 66, hourOffset: 21 },
    { sender: 'them', content: 'Not at all! The basics are super fun once you get the rhythm. There is a great studio in Beer Sheva', dayOffset: 52, hourOffset: 14 },
    { sender: 'me', content: 'Maybe I should check it out sometime', dayOffset: 52, hourOffset: 15 },
    { sender: 'them', content: 'You totally should! Also do you know any good coffee spots near the university?', dayOffset: 38, hourOffset: 10 },
    { sender: 'me', content: 'There is this place called The Third Cup - best espresso I have ever had', dayOffset: 38, hourOffset: 11 },
    { sender: 'them', content: 'Just tried it today - you were so right! The espresso is incredible', dayOffset: 20, hourOffset: 16 },
    { sender: 'me', content: 'Told you! What are you reading these days besides textbooks?', dayOffset: 20, hourOffset: 17 },
    { sender: 'them', content: 'Just started The Body by Bill Bryson - fascinating and funny at the same time', dayOffset: 8, hourOffset: 22 },
    { sender: 'me', content: 'Great choice! Let me know how you like it when you finish', dayOffset: 8, hourOffset: 23 },
  ],
  'demo-user-5': [ // Alex - Diving Instructor, Diving/Travel/Yoga/Music
    { sender: 'them', content: 'Hey! Your profile caught my eye. Have you ever been diving?', dayOffset: 84, hourOffset: 10 },
    { sender: 'me', content: 'Never actually! Always been curious though. Is Eilat good for it?', dayOffset: 84, hourOffset: 11.5 },
    { sender: 'them', content: 'Eilat is one of the best spots in the world! The coral reef here is absolutely mind-blowing', dayOffset: 74, hourOffset: 9 },
    { sender: 'me', content: 'I have heard the Red Sea is incredible for marine life', dayOffset: 74, hourOffset: 10 },
    { sender: 'them', content: 'It really is. Saw a sea turtle yesterday during a morning dive - made my whole week', dayOffset: 62, hourOffset: 17 },
    { sender: 'me', content: 'No way! That must have been absolutely magical', dayOffset: 62, hourOffset: 18 },
    { sender: 'them', content: 'It never gets old honestly. Do you do any water sports at all?', dayOffset: 48, hourOffset: 12 },
    { sender: 'me', content: 'Just swimming. But I do yoga - saw you are into that too!', dayOffset: 48, hourOffset: 13 },
    { sender: 'them', content: 'Yes! I do sunrise yoga on the beach before my morning dives. It is the perfect start to the day', dayOffset: 34, hourOffset: 6 },
    { sender: 'me', content: 'Sunrise yoga on the beach sounds like an absolute dream', dayOffset: 34, hourOffset: 8 },
    { sender: 'them', content: 'Come visit Eilat sometime! I will take you for a beginner dive and morning yoga session', dayOffset: 18, hourOffset: 19 },
    { sender: 'me', content: 'That actually sounds amazing. How warm is the water this time of year?', dayOffset: 18, hourOffset: 20 },
    { sender: 'them', content: 'Perfect temperature right now. Honestly the best time to visit', dayOffset: 5, hourOffset: 11 },
    { sender: 'me', content: 'I might just take you up on that offer!', dayOffset: 5, hourOffset: 12 },
  ],
};

/**
 * Generate demo messages with real timestamps from templates
 * @param {string} demoUserId - The demo user ID (e.g., 'demo-user-1')
 * @param {string} currentUserId - The current logged-in user's ID
 * @returns {Array} Array of message objects ready for display
 */
export function generateDemoMessages(demoUserId, currentUserId) {
  const templates = DEMO_MESSAGE_TEMPLATES[demoUserId];
  if (!templates) return [];

  const now = Date.now();
  return templates.map((tmpl, idx) => ({
    id: `demo-msg-${demoUserId}-${idx}`,
    content: tmpl.content,
    sender_id: tmpl.sender === 'me' ? (currentUserId || 'current-user') : demoUserId,
    created_date: new Date(now - tmpl.dayOffset * 86400000 + tmpl.hourOffset * 3600000).toISOString(),
    isRead: true,
  }));
}
