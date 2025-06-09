(() => {
  // Services price map for price hint
  const servicePrices = {
    'Normal Cutting': 18,
    'Relaxing': 125,
    'Rebonding': 100,
    'Keratin': 300,
    'Perming': 300,
    'Coloring': 50
  };

  const bookingForm = document.getElementById('booking-form');
  const bookingMessage = document.getElementById('booking-message');
  const reviewForm = document.getElementById('review-form');
  const reviewsList = document.getElementById('reviews-list');
  const noReviews = document.getElementById('no-reviews');
  const serviceSelect = bookingForm.elements['service'];
  const serviceHelp = document.getElementById('service-help');
  const dateTimeInput = bookingForm.elements['dateTime'];

  // Set min date-time for booking input to now + 1 hour rounded
  function setMinDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60 - (now.getMinutes() % 60), 0, 0);
    dateTimeInput.min = now.toISOString().slice(0,16);
  }
  setMinDateTime();

  // Update price info on service change
  serviceSelect.addEventListener('change', () => {
    const val = serviceSelect.value;
    if (val && servicePrices[val]) {
      serviceHelp.textContent = `Price: RM ${servicePrices[val]}`;
    } else {
      serviceHelp.textContent = '';
    }
  });

  // Utility: Render reviews UI
  function renderReviews(reviews) {
    reviewsList.innerHTML = '';
    if (!reviews.length) {
      noReviews.hidden = false;
      return;
    }
    noReviews.hidden = true;
    // Show latest first
    reviews.slice().reverse().forEach(r => {
      const art = document.createElement('article');
      art.textContent = r.text;
      reviewsList.appendChild(art);
    });
  }

  // Fetch reviews and render
  function loadReviews() {
    fetch('data.php?action=getReviews')
      .then(res => res.json())
      .then(data => renderReviews(data))
      .catch(() => {
        reviewsList.innerHTML = '<p class="no-data">Failed to load reviews.</p>';
      });
  }

  // Booking form submit handler
  bookingForm.addEventListener('submit', e => {
    e.preventDefault();
    bookingMessage.textContent = '';
    bookingMessage.style.color = '#059669'; // reset color to green success

    const formData = new FormData(bookingForm);
    const name = formData.get('customerName').trim();
    const service = formData.get('service');
    const barber = formData.get('barber');
    const dateTime = formData.get('dateTime');

    if (!name || !service || !barber || !dateTime) {
      bookingMessage.style.color = '#b91c1c'; // red
      bookingMessage.textContent = 'Please fill all fields correctly.';
      return;
    }

    // Validate date/time >= min datetime
    if (new Date(dateTime) < new Date(dateTimeInput.min)) {
      bookingMessage.style.color = '#b91c1c';
      bookingMessage.textContent = 'Please select a valid date and time at least 1 hour from now.';
      return;
    }

    fetch('data.php?action=saveBooking', {
      method: 'POST',
      body: new URLSearchParams(formData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).then((res) => res.json())
      .then(data => {
        if (data.success) {
          bookingMessage.textContent = 'Appointment booked successfully!';
          bookingForm.reset();
          serviceHelp.textContent = '';
          setMinDateTime();
        } else {
          bookingMessage.style.color = '#b91c1c';
          bookingMessage.textContent = 'Failed to book appointment. Try again.';
        }
      }).catch(() => {
        bookingMessage.style.color = '#b91c1c';
        bookingMessage.textContent = 'Network error. Please try again later.';
      });
  });

  // Review form submit handler
  reviewForm.addEventListener('submit', e => {
    e.preventDefault();

    const formData = new FormData(reviewForm);
    const text = formData.get('reviewText').trim();

    if (!text || text.length < 10) {
      alert('Review must be at least 10 characters.');
      return;
    }

    fetch('data.php?action=saveReview', {
      method: 'POST',
      body: new URLSearchParams(formData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).then(res => res.json())
      .then(data => {
        if (data.success) {
          reviewForm.reset();
          loadReviews();
          alert('Thank you for your review!');
        } else {
          alert('Failed to submit review. Please try again.');
        }
      }).catch(() => {
        alert('Network error. Please try again later.');
      });
  });

  loadReviews();
})();
