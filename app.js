// Maher Travel - Main Application Script

const STAFF_PASSWORD = 'maher123';
const BOOKINGS_STORAGE_KEY = 'maher_travel_bookings';
const COUNTER_STORAGE_KEY = 'maher_travel_counter';

let currentFilter = 'all';
let bookings = [];

document.addEventListener('DOMContentLoaded', function () {
    loadBookings();
    setupEventListeners();
    setMinDate();
    updateStaffStats();
});

function setupEventListeners() {
    document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmit);

    document.getElementById('referenceSearch').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') searchBooking();
    });
}

function handleBookingSubmit(e) {
    e.preventDefault();

    const booking = {
        pickup: document.getElementById('pickup').value.trim(),
        destination: document.getElementById('destination').value.trim(),
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        passengers: document.getElementById('passengers').value,
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        notes: document.getElementById('notes').value.trim(),
        status: 'New',
        reference: generateReference(),
        createdAt: new Date().toISOString()
    };

    bookings.push(booking);
    saveBookings();

    showConfirmationModal(booking.reference);
    document.getElementById('bookingForm').reset();
    setMinDate();
    updateStaffStats();
}

function generateReference() {
    const today = new Date();
    const date =
        today.getFullYear() +
        String(today.getMonth() + 1).padStart(2, '0') +
        String(today.getDate()).padStart(2, '0');

    return `MH-${date}-${String(getAndIncrementCounter()).padStart(3, '0')}`;
}

function getAndIncrementCounter() {
    let counter = parseInt(localStorage.getItem(COUNTER_STORAGE_KEY) || '0', 10);
    counter++;
    localStorage.setItem(COUNTER_STORAGE_KEY, counter.toString());
    return counter;
}

function showConfirmationModal(reference) {
    document.getElementById('referenceNumber').textContent = reference;
    document.getElementById('successModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('successModal').style.display = 'none';
}

function copyReference() {
    const reference = document.getElementById('referenceNumber').textContent;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(reference).then(function () {
            const button = document.querySelector('.btn-copy');
            const oldText = button.textContent;
            button.textContent = '✓ Copied!';

            setTimeout(function () {
                button.textContent = oldText;
            }, 2000);
        });
    }
}

function searchBooking() {
    const reference = document
        .getElementById('referenceSearch')
        .value
        .trim()
        .toUpperCase();

    const booking = bookings.find(function (b) {
        return b.reference === reference;
    });

    if (booking) {
        displayBookingStatus(booking);
    } else {
        alert('Booking not found. Please check your reference number.');
        document.getElementById('statusResult').style.display = 'none';
    }
}

function displayBookingStatus(booking) {
    const dateTime = new Date(
        booking.date + 'T' + booking.time
    ).toLocaleString();

    document.getElementById('statusRef').textContent = booking.reference;
    document.getElementById('statusPickup').textContent = booking.pickup;
    document.getElementById('statusDest').textContent = booking.destination;
    document.getElementById('statusDateTime').textContent = dateTime;
    document.getElementById('statusPass').textContent =
        booking.passengers + ' passenger(s)';
    document.getElementById('statusName').textContent = booking.name;
    document.getElementById('statusPhone').textContent = booking.phone;

    if (booking.notes) {
        document.getElementById('statusNotesRow').style.display = 'flex';
        document.getElementById('statusNotes').textContent = booking.notes;
    } else {
        document.getElementById('statusNotesRow').style.display = 'none';
    }

    const badge = document.getElementById('statusBadge');
    badge.className = 'status-badge ' + booking.status.toLowerCase();
    badge.textContent = booking.status;

    document.getElementById('statusResult').style.display = 'block';
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(function (tab) {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.nav-btn').forEach(function (btn) {
        btn.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');

    if (event && event.target) {
        event.target.classList.add('active');
    }

    if (tabName === 'staff') {
        if (!sessionStorage.getItem('staffLoggedIn')) {
            showStaffModal();
        } else {
            renderStaffDashboard();
        }
    }
}

function showStaffModal() {
    document.getElementById('staffModal').style.display = 'flex';
}

function closeStaffModal() {
    document.getElementById('staffModal').style.display = 'none';
    document.getElementById('staffPassword').value = '';
    showTab('booking');
}

function verifyStaffPassword() {
    const password = document.getElementById('staffPassword').value;

    if (password === STAFF_PASSWORD) {
        sessionStorage.setItem('staffLoggedIn', 'true');
        document.getElementById('staffModal').style.display = 'none';
        document.getElementById('staffPassword').value = '';
        renderStaffDashboard();
    } else {
        alert('Incorrect password!');
        document.getElementById('staffPassword').value = '';
    }
}

function renderStaffDashboard() {
    updateStaffStats();
    displayBookings(currentFilter);
}

function updateStaffStats() {
    const stats = {
        New: 0,
        Confirmed: 0,
        Rejected: 0,
        Cancelled: 0
    };

    bookings.forEach(function (booking) {
        if (stats.hasOwnProperty(booking.status)) {
            stats[booking.status]++;
        }
    });

    document.getElementById('statNew').textContent = stats.New;
    document.getElementById('statConfirmed').textContent = stats.Confirmed;
    document.getElementById('statRejected').textContent = stats.Rejected;
    document.getElementById('statCancelled').textContent = stats.Cancelled;
}

function filterBookings(status) {
    currentFilter = status;

    document.querySelectorAll('.filter-btn').forEach(function (btn) {
        btn.classList.remove('active');
    });

    if (event && event.target) {
        event.target.classList.add('active');
    }

    displayBookings(status);
}

function displayBookings(status) {
    const container = document.getElementById('staffBookings');

    let filteredBookings = bookings.slice();

    if (status !== 'all') {
        filteredBookings = filteredBookings.filter(function (booking) {
            return booking.status === status;
        });
    }

    filteredBookings.sort(function (a, b) {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (filteredBookings.length === 0) {
        container.innerHTML =
            '<div class="empty-state"><p>No bookings found</p></div>';
        return;
    }

    container.innerHTML = filteredBookings.map(function (booking) {
        const dateTime = new Date(
            booking.date + 'T' + booking.time
        ).toLocaleString();

        return `
            <div class="booking-row">
                <div class="booking-row-header">
                    <span class="booking-ref">${escapeHTML(booking.reference)}</span>
                    <span class="status-badge ${booking.status.toLowerCase()}">${escapeHTML(booking.status)}</span>
                </div>

                <div class="booking-row-details">
                    <div class="detail-item">
                        <span class="detail-label">Pickup</span>
                        <span class="detail-value">${escapeHTML(booking.pickup)}</span>
                    </div>

                    <div class="detail-item">
                        <span class="detail-label">Destination</span>
                        <span class="detail-value">${escapeHTML(booking.destination)}</span>
                    </div>

                    <div class="detail-item">
                        <span class="detail-label">Date & Time</span>
                        <span class="detail-value">${escapeHTML(dateTime)}</span>
                    </div>

                    <div class="detail-item">
                        <span class="detail-label">Passengers</span>
                        <span class="detail-value">${escapeHTML(booking.passengers)}</span>
                    </div>

                    <div class="detail-item">
                        <span class="detail-label">Name</span>
                        <span class="detail-value">${escapeHTML(booking.name)}</span>
                    </div>

                    <div class="detail-item">
                        <span class="detail-label">Phone</span>
                        <span class="detail-value">${escapeHTML(booking.phone)}</span>
                    </div>

                    ${
                        booking.notes
                            ? `
                    <div class="detail-item" style="grid-column: 1/-1;">
                        <span class="detail-label">Notes</span>
                        <span class="detail-value">${escapeHTML(booking.notes)}</span>
                    </div>`
                            : ''
                    }
                </div>

                <div class="booking-row-actions">
                    <select class="status-select"
                        onchange="updateBookingStatus('${escapeHTML(booking.reference)}', this.value)">
                        <option value="New" ${booking.status === 'New' ? 'selected' : ''}>New</option>
                        <option value="Confirmed" ${booking.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="Rejected" ${booking.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                        <option value="Cancelled" ${booking.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>

                    <button class="btn btn-danger"
                        onclick="deleteBooking('${escapeHTML(booking.reference)}')">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateBookingStatus(reference, newStatus) {
    const booking = bookings.find(function (b) {
        return b.reference === reference;
    });

    if (booking) {
        booking.status = newStatus;
        saveBookings();
        updateStaffStats();
        displayBookings(currentFilter);
    }
}

function deleteBooking(reference) {
    if (!confirm('Are you sure you want to delete this booking?')) {
        return;
    }

    bookings = bookings.filter(function (booking) {
        return booking.reference !== reference;
    });

    saveBookings();
    updateStaffStats();
    displayBookings(currentFilter);
}

function exportBookings() {
    if (bookings.length === 0) {
        alert('No bookings to export');
        return;
    }

    let csv =
        'Reference,Pickup,Destination,Date,Time,Passengers,Name,Phone,Notes,Status,Created At\n';

    bookings.forEach(function (booking) {
        const row = [
            booking.reference,
            csvEscape(booking.pickup),
            csvEscape(booking.destination),
            booking.date,
            booking.time,
            booking.passengers,
            csvEscape(booking.name),
            csvEscape(booking.phone),
            csvEscape(booking.notes),
            booking.status,
            csvEscape(new Date(booking.createdAt).toLocaleString())
        ].join(',');

        csv += row + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download =
        'maher-travel-bookings-' +
        new Date().toISOString().split('T')[0] +
        '.csv';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function csvEscape(value) {
    return '"' + String(value || '').replace(/"/g, '""') + '"';
}

function escapeHTML(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function saveBookings() {
    localStorage.setItem(
        BOOKINGS_STORAGE_KEY,
        JSON.stringify(bookings)
    );
}

function loadBookings() {
    try {
        const stored = localStorage.getItem(BOOKINGS_STORAGE_KEY);
        bookings = stored ? JSON.parse(stored) : [];
    } catch (error) {
        bookings = [];
    }
}

function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');

    if (dateInput) {
        dateInput.min = today;
    }
}

function logout() {
    sessionStorage.removeItem('staffLoggedIn');
    showTab('booking');
}
