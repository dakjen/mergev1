import React from 'react'; // Remove useState, useEffect, axios

const GrantCalendar = () => {
  // Your provided Google Calendar embed URL
  const googleCalendarEmbedUrl = "https://calendar.google.com/calendar/embed?src=c_48158deb317d0fd30228dfa41770decac6f0e4620348a2c5d39952a81b92e306%40group.calendar.google.com&ctz=America%2FNew_York";

  return (
    <div style={{ padding: '20px' }}>
      <h2>Grant Calendar</h2> {/* Simplified title */}

      {/* Integrated Google Calendar */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Google Calendar</h3>
        <iframe
          src={googleCalendarEmbedUrl}
          style={{ border: 0, width: '800px', height: '600px', frameborder: 0, scrolling: 'no' }}
          title="Google Calendar"
        ></iframe>
      </div>
    </div>
  );
};

export default GrantCalendar;