// Load data and initialize the application
fetch('nursery_indus_student.json')
    .then(response => response.json())
    .then(data => {
        const students = data.students;
        const teachers = data.teachers;

        // Add school info to each student object
        students.forEach(student => {
            student.school = data.school;
            student.type = "student";
        });

        // Add school info to each teacher object
        teachers.forEach(teacher => {
            teacher.school = data.school;
            teacher.type = "teacher";
        });

        generateStudentIDCards(students);
        generateTeacherIDCards(teachers);
        setupEventListeners();
        checkUrlForIDData([...students, ...teachers]);
    })
    .catch(error => console.error('Error loading data:', error));

/**
 * Generates ID cards for all students
 * @param {Array} students - Array of student objects
 */
function generateStudentIDCards(students) {
    const cardsContainer = document.getElementById('studentCardsContainer');

    if (!cardsContainer) {
        console.error('Student container element not found');
        return;
    }

    if (typeof QRCode === 'undefined') {
        console.error('QRCode library not loaded!');
        return;
    }

    students.forEach(student => {
        const card = createIDCard(student, "student");
        cardsContainer.appendChild(card);
        generateQRCodeForID(student);
    });
}

/**
 * Generates ID cards for all teachers
 * @param {Array} teachers - Array of teacher objects
 */
function generateTeacherIDCards(teachers) {
    const cardsContainer = document.getElementById('teacherCardsContainer');

    if (!cardsContainer) {
        console.error('Teacher container element not found');
        return;
    }

    teachers.forEach(teacher => {
        const card = createIDCard(teacher, "teacher");
        cardsContainer.appendChild(card);
        generateQRCodeForID(teacher);
    });
}

/**
 * Creates an ID card for either student or teacher
 * @param {Object} person - Student or teacher object
 * @param {String} type - Either "student" or "teacher"
 */
function createIDCard(person, type) {
    // Create front of ID card
    const frontCard = document.createElement('article');
    frontCard.className = 'id-card';

    let personalInfoHTML = '';
    if (type === "student") {
        personalInfoHTML = `
            <div class="info-item"><span>Class: </span> ${person.class}&nbsp;</div>
            <div class="info-item"><span>Father's Name: </span> ${person.father || 'N/A'}&nbsp;</div>
        `;
    } else {
        personalInfoHTML = `
            <div class="info-item"><span>Designation: </span> ${person.designation}&nbsp;</div>
            ${person.related_persons.map(p =>
            `<div class="info-item"><span>${p.relation.charAt(0).toUpperCase() + p.relation.slice(1)}: </span> ${p.name}&nbsp;</div>`
        ).join('')}
        `;
    }

    frontCard.innerHTML = `
        <header class="school-card__header">
            <h1 class="school-name">${person.school.name}</h1>
            <div class="school-details">
                <p class="school-address">${person.school.address}</p>
                <p class="school-number">Phone: ${person.school.contact.phone}</p>
                <p class="school-session">
                    <span class="session-label">Session:</span>
                    <span class="session-value">${person.school.session}</span>
                </p>
            </div>
        </header>
        <section class="body-section">
            <div class="qr-code">
                    <div id="qr-${person.type}-${person.id}" class="qr-code-container"></div>

                </div>
            <div class="photo">
                <img 
                    src="${person.photo || 'https://via.placeholder.com/110x120?text=Photo+Not+Available'}" 
                    alt="${type} Photo" 
                    onerror="this.src='https://via.placeholder.com/110x120?text=Photo+Not+Available'" />
            </div>
            <div class="details">
              <div class="chairman-sign">
        <img src="/chairman_signature.jpg" alt="Chairman's Signature">
    </div>
    <div class="chairman-title">Chairman</div>
                <h1 class="name">${person.name.toUpperCase()}</h1>
                <div class="info-list">
                    ${personalInfoHTML}
                    <div class="Contact"><span>Contact: </span> ${person.contact}&nbsp;</div>
                    ${type === "student" ? `<div class="info-item"><span>DOB: </span> ${person.dob}&nbsp;</div>` : ''}
                    <div class="info-item address"><span>Add:</span> ${person.address.replace(/,/g, ',')}&nbsp;</div>
                </div>
            </div>
        </section>
    `;

    // Create back of ID card
    const backCard = document.createElement('article');
    backCard.className = 'id-card back';
    backCard.innerHTML = `
        <img src="${person.school.logo}" alt="School Logo" class="back-logo" onerror="this.style.display='none'">
        <h2 class="back-title">${person.school.name}</h2>
        <p>Dise Code: ${person.school.codes?.udise || 'N/A'}</p>
        <img src="${person.school.building}" alt="School Building" class="building" onerror="this.style.display='none'">
        <div class="back-info">
            <p>${person.school.address}</p>
        </div>
        <div class="back-contact">
     
            <p>Email: ${person.school.contact.email}</p>
        </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.className = 'id-card-wrapper';
    wrapper.appendChild(frontCard);
    wrapper.appendChild(backCard);

    return wrapper;
}

/**
 * Generates QR code for a student or teacher
 * @param {Object} person - Student or teacher object
 */
function generateQRCodeForID(person) {
    const qrContainer = document.getElementById(`qr-${person.type}-${person.id}`);
    if (!qrContainer) return;

    const url = `${window.location.origin}${window.location.pathname}?type=${person.type}&id=${person.id}`;
    qrContainer.innerHTML = '';

    new QRCode(qrContainer, {
        text: url,
        width: 90,
        height: 90,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    qrContainer.addEventListener('click', () => {
        window.open(url, '_blank');
    });
}

/**
 * Displays verification information
 * @param {Object} person - Student or teacher object to verify
 */
function showVerification(person) {
    // Activate verification tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-tab="verification"]').classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById('verification').classList.add('active');

    // Create photo HTML with fallback
    const photoHtml = `
        <div class="verification-photo">
            <div class="photo-container">
                <img src="${person.photo || 'https://via.placeholder.com/200x250?text=Photo+Not+Available'}" 
                     alt="${person.name}" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/200x250?text=Photo+Not+Available'">
            </div>
            <div class="photo-meta">${person.name}'s Photo</div>
        </div>
    `;

    let personalDetailsHTML = '';
    if (person.type === "student") {
        personalDetailsHTML = `
            <p><strong>Class:</strong> ${person.class}</p>
            <p><strong>Father's Name:</strong> ${person.father || 'N/A'}</p>
            <p><strong>Date of Birth:</strong> ${person.dob}</p>
        `;
    } else {
        personalDetailsHTML = `
            <p><strong>Designation:</strong> ${person.designation}</p>
            ${person.related_persons.map(p =>
            `<p><strong>${p.relation.charAt(0).toUpperCase() + p.relation.slice(1)}:</strong> ${p.name}</p>`
        ).join('')}
        `;
    }

    // Generate verification details HTML
    document.getElementById('verificationDetails').innerHTML = `
        ${photoHtml}
        <div class="detail-grid">
            <div class="detail-card">
                <h3><i class="fas fa-user"></i> ${person.type === 'student' ? 'Student' : 'Teacher'} Information</h3>
                <p><strong>Name:</strong> ${person.name}</p>

                ${personalDetailsHTML}
                <p><strong>Contact:</strong> ${person.contact}</p>
                <p><strong>Address:</strong> ${person.address}</p>
            </div>
            
            <div class="detail-card">
                <h3><i class="fas fa-school"></i> School Information</h3>
                <p><strong>School Name:</strong> ${person.school.name}</p>
                <p><strong>Address:</strong> ${person.school.address}</p>
                <p><strong>Session:</strong> ${person.school.session}</p>
                <p><strong>${person.type === 'student' ? 'Scholar' : 'Staff'} Code:</strong> ${person.school.codes?.Scholar || 'N/A'}</p>
                <p><strong>Dise Code:</strong> ${person.school.codes?.udise || 'N/A'}</p>
            </div>
            
            <div class="detail-card">
                <h3><i class="fas fa-phone"></i> School Contact</h3>
                <p><strong>Phone:</strong> ${person.school.contact.phone}</p>
                <p><strong>Email:</strong> ${person.school.contact.email}</p>
            </div>
            
            <div class="detail-card">
                <h3><i class="fas fa-calendar-check"></i> Validity</h3>
                <p><strong>Valid Through:</strong> 2027</p>
                <p><strong>Status:</strong> <span class="status-active">Active</span></p>
            </div>
        </div>
    `;

    document.getElementById('statusText').innerHTML = `
        <i class="fas fa-check-circle"></i> ID Verified Successfully!
        <small>Verified on ${new Date().toLocaleDateString()}</small>
    `;
}

/**
 * Sets up event listeners for UI interactions
 */
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Download buttons
    document.getElementById('downloadStudentQR')?.addEventListener('click', () => {
        alert('Student QR Code export feature will be implemented soon');
    });

    document.getElementById('downloadTeacherQR')?.addEventListener('click', () => {
        alert('Teacher QR Code export feature will be implemented soon');
    });
}

/**
 * Checks URL for ID parameter and shows verification if found
 * @param {Array} people - Array of student and teacher objects
 */
function checkUrlForIDData(people) {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const type = urlParams.get('type');

    if (id && type) {
        const person = people.find(p => p.id === id && p.type === type);
        if (person) {
            showVerification(person);
            // Scroll to verification section
            setTimeout(() => {
                document.getElementById('verification').scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            document.getElementById('statusText').innerHTML = `
                <i class="fas fa-times-circle"></i> Invalid ID
                <small>No ${type} found with ID: ${id}</small>
            `;
        }
    }
}

/**
 * Print only teacher cards
 */
function printTeacherCards() {
    const originalDisplay = document.getElementById('student-cards').style.display;
    document.getElementById('student-cards').style.display = 'none';
    document.getElementById('teacher-cards').style.display = 'block';
    document.querySelector('[data-tab="teacher-cards"]').classList.add('active');

    window.print();

    document.getElementById('student-cards').style.display = originalDisplay;
    document.querySelector('[data-tab="teacher-cards"]').classList.remove('active');
    document.querySelector('[data-tab="student-cards"]').classList.add('active');
}
