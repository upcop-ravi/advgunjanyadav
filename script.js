document.addEventListener('DOMContentLoaded', function () {
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
if (mobileMenuBtn && mobileMenu) {
mobileMenuBtn.addEventListener('click', function (e) {
e.stopPropagation();
mobileMenu.classList.toggle('hidden');
});
document.addEventListener('click', function (e) {
if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
mobileMenu.classList.add('hidden');
}
});
const mobileLinks = mobileMenu.querySelectorAll('a');
mobileLinks.forEach(link => {
link.addEventListener('click', () => {
mobileMenu.classList.add('hidden');
});
});
}
const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
const isDark = localStorage.getItem('color-theme') === 'dark' ||
(!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
if (isDark) {
document.documentElement.classList.add('dark');
} else {
document.documentElement.classList.remove('dark');
}
themeToggleBtn.addEventListener('click', function () {
if (document.documentElement.classList.contains('dark')) {
document.documentElement.classList.remove('dark');
localStorage.setItem('color-theme', 'light');
} else {
document.documentElement.classList.add('dark');
localStorage.setItem('color-theme', 'dark');
}
});
}
const counters = document.querySelectorAll('.counter');
if (counters.length > 0) {
const speed = 200;
const animateCounter = (counter) => {
const target = +counter.getAttribute('data-target');
const updateCount = () => {
const count = +counter.innerText;
const increment = target / 100;
if (count < target) {
counter.innerText = Math.ceil(count + increment);
setTimeout(updateCount, 20);
} else {
counter.innerText = target;
}
};
updateCount();
};
const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
const counter = entry.target;
if (!counter.classList.contains('counted')) {
counter.classList.add('counted');
animateCounter(counter);
}
}
});
}, { threshold: 0.2 });
counters.forEach(counter => observer.observe(counter));
}
const track = document.getElementById('team-track');
const prevBtn = document.getElementById('team-prev-btn');
const nextBtn = document.getElementById('team-next-btn');
const items = document.querySelectorAll('.team-item');
const sliderContainer = document.getElementById('team-slider-container');
if (track && items.length > 0) {
const totalItems = items.length;
let isTransitioning = false;

function getVisibleCount() {
if (window.innerWidth >= 1280) return 4;
if (window.innerWidth >= 1024) return 3;
if (window.innerWidth >= 640) return 2;
return 1;
}

// Clone items at both ends for seamless infinite loop
function setupClones() {
// Remove any existing clones
track.querySelectorAll('.team-clone').forEach(c => c.remove());

const visibleCount = getVisibleCount();
// Clone last N items and prepend
for (let i = totalItems - 1; i >= Math.max(0, totalItems - visibleCount); i--) {
const clone = items[i].cloneNode(true);
clone.classList.add('team-clone');
track.insertBefore(clone, track.firstChild);
}
// Clone first N items and append
for (let i = 0; i < Math.min(visibleCount, totalItems); i++) {
const clone = items[i].cloneNode(true);
clone.classList.add('team-clone');
track.appendChild(clone);
}
}

let currentIndex = 0; // relative to original items (0-based)

function getItemWidth() {
return 100 / getVisibleCount();
}

function getCloneOffset() {
return getVisibleCount(); // number of clones prepended
}

function updatePosition(animate) {
const itemWidth = getItemWidth();
const offset = (currentIndex + getCloneOffset()) * itemWidth;
if (animate === false) {
track.style.transition = 'none';
} else {
track.style.transition = 'transform 0.5s ease-in-out';
}
track.style.transform = `translateX(-${offset}%)`;
// Force reflow when disabling transition
if (animate === false) {
track.offsetHeight;
}
}

function slideNext() {
if (isTransitioning) return;
isTransitioning = true;
currentIndex++;
updatePosition(true);
}

function slidePrev() {
if (isTransitioning) return;
isTransitioning = true;
currentIndex--;
updatePosition(true);
}

// After transition ends, silently reset if we've gone into clone territory
track.addEventListener('transitionend', function () {
const visibleCount = getVisibleCount();
if (currentIndex >= totalItems) {
currentIndex = 0;
updatePosition(false);
} else if (currentIndex < 0) {
currentIndex = totalItems - 1;
updatePosition(false);
}
isTransitioning = false;
});

if (nextBtn) {
nextBtn.addEventListener('click', slideNext);
}
if (prevBtn) {
prevBtn.addEventListener('click', slidePrev);
}

let autoSlideInterval = setInterval(slideNext, 5000);

if (sliderContainer) {
sliderContainer.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
sliderContainer.addEventListener('mouseleave', () => {
clearInterval(autoSlideInterval);
autoSlideInterval = setInterval(slideNext, 5000);
});
}

window.addEventListener('resize', () => {
setupClones();
if (currentIndex >= totalItems) {
currentIndex = 0;
}
updatePosition(false);
});

// Initialize
setupClones();
updatePosition(false);

if (sliderContainer) {
let touchStartX = 0;
let touchEndX = 0;
sliderContainer.addEventListener('touchstart', (e) => {
touchStartX = e.changedTouches[0].screenX;
}, { passive: true });
sliderContainer.addEventListener('touchend', (e) => {
touchEndX = e.changedTouches[0].screenX;
const swipeThreshold = 50;
if (touchStartX - touchEndX > swipeThreshold) {
slideNext();
} else if (touchEndX - touchStartX > swipeThreshold) {
slidePrev();
}
}, { passive: true });
}
}
const modal = document.getElementById('disclaimer-modal');
const acceptBtn = document.getElementById('accept-disclaimer');
if (modal && acceptBtn) {
if (!localStorage.getItem('bci_disclaimer_accepted')) {
modal.classList.remove('hidden');
document.body.style.overflow = 'hidden';
}
acceptBtn.addEventListener('click', function () {
modal.classList.add('opacity-0');
localStorage.setItem('bci_disclaimer_accepted', 'true');
setTimeout(() => {
modal.classList.add('hidden');
document.body.style.overflow = '';
}, 300);
});
}
});

/* Global Custom Helper Functions (Used by FAQ sections and WhatsApp Forms) */

function toggleFaq(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('.faq-icon');
    const allContent = document.querySelectorAll('.faq-content');
    const allIcons = document.querySelectorAll('.faq-icon');
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    allContent.forEach((c, idx) => {
        if (c !== content) {
            c.style.maxHeight = null;
            allIcons[idx].classList.remove('rotate-45', 'bg-gold-500', 'text-white');
            allIcons[idx].closest('button').setAttribute('aria-expanded', 'false');
        }
    });
    if (isExpanded) {
        content.style.maxHeight = null;
        icon.classList.remove('rotate-45', 'bg-gold-500', 'text-white');
        button.setAttribute('aria-expanded', 'false');
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
        icon.classList.add('rotate-45', 'bg-gold-500', 'text-white');
        button.setAttribute('aria-expanded', 'true');
    }
}

function toggleFAQ(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('span');
    content.classList.toggle('hidden');
    icon.textContent = content.classList.contains('hidden') ? '+' : '-';
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function sendPracticeAreaInquiry(nameId, mobileId, districtId, stateId, problemId, prefixText) {
    const name = getVal(nameId);
    const mobile = getVal(mobileId);
    const district = getVal(districtId);
    const state = getVal(stateId);
    const problem = getVal(problemId);

    const message = `*${prefixText}*%0A%0A` +
        `*Name:* ${encodeURIComponent(name)}%0A` +
        `*Mobile:* ${mobile}%0A` +
        `*District:* ${encodeURIComponent(district)}%0A` +
        `*State:* ${encodeURIComponent(state)}%0A` +
        `*Issue:* ${encodeURIComponent(problem)}%0A%0A` +
        `_I need urgent legal assistance regarding the above matter._`;

    const whatsappNumber = '919454072550';
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappURL, '_blank');
}

function sendChequeToWhatsApp(event) {
    event.preventDefault();
    sendPracticeAreaInquiry('cheque-name', 'cheque-mobile', 'cheque-district', 'cheque-state', 'cheque-problem', 'Cheque Case Legal Counsel Request');
}

function sendCivilToWhatsApp(event) {
    event.preventDefault();
    sendPracticeAreaInquiry('civil-name', 'civil-mobile', 'civil-district', 'civil-state', 'civil-problem', 'Civil Legal Consultation Request');
}

function sendArbitrationToWhatsApp(event) {
    event.preventDefault();
    sendPracticeAreaInquiry('arb-name', 'arb-mobile', 'arb-district', 'arb-state', 'arb-problem', 'Arbitration & Dispute Resolution');
}

function sendBankingToWhatsApp(event) {
    event.preventDefault();
    if (document.getElementById('Banking-name')) {
        sendPracticeAreaInquiry('Banking-name', 'Banking-mobile', 'Banking-district', 'Banking-state', 'Banking-problem', 'Motor Accident Claims (MACT) Case');
    } else {
        sendPracticeAreaInquiry('banking-name', 'banking-mobile', 'banking-district', 'banking-state', 'banking-problem', 'Banking & Finance Case');
    }
}

function sendBirthDeathToWhatsApp(event) {
    event.preventDefault();
    sendPracticeAreaInquiry('bd-name', 'bd-mobile', 'bd-district', 'bd-state', 'bd-problem', 'Birth/Death Certificate Inquiry');
}

function sendCommercialToWhatsApp(event) {
    event.preventDefault();
    const name = getVal('Commercial-name');
    const mobile = getVal('Commercial-mobile');
    const company = getVal('Commercial-company');
    const problem = getVal('Commercial-problem');
    const message = `*Commercial Dispute Case*%0A%0A` +
        `*Name:* ${encodeURIComponent(name)}%0A` +
        `*Mobile:* ${mobile}%0A` +
        `*Company:* ${encodeURIComponent(company)}%0A` +
        `*Issue:* ${encodeURIComponent(problem)}%0A%0A` +
        `_I need urgent legal assistance regarding the above matter._`;
    window.open(`https://wa.me/919454072550?text=${message}`, '_blank');
}

function sendCorporateToWhatsApp(event) {
    event.preventDefault();
    const name = getVal('corp-name');
    const mobile = getVal('corp-mobile');
    const company = getVal('corp-company');
    const problem = getVal('corp-problem');
    const message = `*Corporate Case Inquiry*%0A%0A` +
        `*Name:* ${encodeURIComponent(name)}%0A` +
        `*Mobile:* ${mobile}%0A` +
        `*Company:* ${encodeURIComponent(company)}%0A` +
        `*Problem:* ${encodeURIComponent(problem)}%0A%0A` +
        `_I need urgent legal assistance regarding the above matter._`;
    window.open(`https://wa.me/919454072550?text=${message}`, '_blank');
}

function sendMarriageToWhatsApp(event) {
    event.preventDefault();
    sendPracticeAreaInquiry('marriage-name', 'marriage-mobile', 'marriage-district', 'marriage-state', 'marriage-problem', 'Court Marriage Consultation');
}

function sendCriminalToWhatsApp(event) {
    event.preventDefault();
    sendPracticeAreaInquiry('criminal-name', 'criminal-mobile', 'criminal-district', 'criminal-state', 'criminal-problem', 'Criminal Case Inquiry');
}

function sendDVToWhatsApp(event) {
    event.preventDefault();
    sendPracticeAreaInquiry('dv-name', 'dv-mobile', 'dv-district', 'dv-state', 'dv-problem', 'Domestic Violence Case');
}

function sendFamilyToWhatsApp(event) {
    event.preventDefault();
    sendPracticeAreaInquiry('family-name', 'family-mobile', 'family-district', 'family-state', 'family-problem', 'Family Law Inquiry');
}

function sendIPToWhatsApp(event) {
    event.preventDefault();
    const name = getVal('civil-name');
    const mobile = getVal('civil-mobile');
    const problem = getVal('ip-problem');
    const message = `*Intellectual Property (IP) Inquiry*%0A%0A` +
        `*Name:* ${encodeURIComponent(name)}%0A` +
        `*Mobile:* ${mobile}%0A` +
        `*Issue:* ${encodeURIComponent(problem)}%0A%0A` +
        `_I need urgent legal assistance regarding the above matter._`;
    window.open(`https://wa.me/919454072550?text=${message}`, '_blank');
}

function sendLabourToWhatsApp(event) {
    event.preventDefault();
    sendPracticeAreaInquiry('labour-name', 'labour-mobile', 'labour-district', 'labour-state', 'labour-problem', 'Labour Law Dispute');
}

function sendPropertyToWhatsApp(event) {
    event.preventDefault();
    sendPracticeAreaInquiry('Property-name', 'Property-mobile', 'Property-district', 'Property-state', 'Property-problem', 'Property Case Inquiry');
}

function sendDocumentationToWhatsApp(event) {
    event.preventDefault();
    sendPracticeAreaInquiry('documentation-name', 'documentation-mobile', 'documentation-district', 'documentation-state', 'documentation-problem', 'Legal Drafting & Documentation');
}

function sendRERAToWhatsApp(event) {
    event.preventDefault();
    const name = getVal('civil-name');
    const mobile = getVal('civil-mobile');
    const district = getVal('civil-district');
    const state = getVal('civil-state');
    const problem = getVal('rera-problem');
    const message = `*RERA Law Inquiry*%0A%0A` +
        `*Name:* ${encodeURIComponent(name)}%0A` +
        `*Mobile:* ${mobile}%0A` +
        `*District:* ${encodeURIComponent(district)}%0A` +
        `*State:* ${encodeURIComponent(state)}%0A` +
        `*Problem:* ${encodeURIComponent(problem)}%0A%0A` +
        `_I need urgent legal assistance regarding the above matter._`;
    window.open(`https://wa.me/919454072550?text=${message}`, '_blank');
}

function sendTaxToWhatsApp(event) {
    event.preventDefault();
    sendPracticeAreaInquiry('tax-name', 'tax-mobile', 'tax-district', 'tax-state', 'tax-problem', 'GST & Taxation Dispute');
}

function sendTrafficToWhatsApp(event) {
    event.preventDefault();
    const name = getVal('Traffic-name');
    const mobile = getVal('Traffic-mobile');
    const vehicle = getVal('Traffic-vehicle');
    const issue = getVal('Traffic-issue');
    const message = `*Traffic Challan Assistance*%0A%0A` +
        `*Name:* ${encodeURIComponent(name)}%0A` +
        `*Mobile:* ${mobile}%0A` +
        `*Vehicle Details:* ${encodeURIComponent(vehicle)}%0A` +
        `*Challan / Issue Details:* ${encodeURIComponent(issue)}%0A%0A` +
        `_Please assist with resolving my traffic challan matter._`;
    window.open(`https://wa.me/919454072550?text=${message}`, '_blank');
}

function sendWritToWhatsApp(event) {
    event.preventDefault();
    const name = getVal('writ-name');
    const authority = getVal('writ-authority');
    const type = getVal('writ-type');
    const message = `*Writ Petition Consultation Request*%0A%0A` +
        `*Name:* ${encodeURIComponent(name)}%0A` +
        `*Respondent Authority:* ${encodeURIComponent(authority)}%0A` +
        `*Complaint Reason:* ${encodeURIComponent(type)}%0A%0A` +
        `_I wish to consult regarding filing a Writ Petition in High Court._`;
    window.open(`https://wa.me/919454072550?text=${message}`, '_blank');
}

function submitLegalAid(event) {
    event.preventDefault();
    const name = getVal('aid-name');
    const phone = getVal('aid-phone');
    const subject = getVal('aid-subject');
    const issue = getVal('aid-issue');
    const message = `*Legal Aid & Pro-Bono Request*%0A%0A` +
        `*Name:* ${encodeURIComponent(name)}%0A` +
        `*Mobile:* ${phone}%0A` +
        `*Subject:* ${encodeURIComponent(subject)}%0A` +
        `*Details:* ${encodeURIComponent(issue)}%0A%0A` +
        `_Requesting legal assistance under pro-bono scheme._`;
    window.open(`https://wa.me/919454072550?text=${message}`, '_blank');
}

function sendToWhatsApp(event) {
    event.preventDefault();
    if (document.getElementById('consult-name')) {
        const name = getVal('consult-name');
        const phone = getVal('consult-phone');
        const issue = getVal('consult-issue');
        if (!name || !phone || !issue) {
            alert('Please fill in all fields');
            return;
        }
        const message = `*Quick Consultation Request*%0A%0A*Name:* ${encodeURIComponent(name)}%0A*Phone:* ${phone}%0A*Legal Issue:* ${encodeURIComponent(issue)}%0A%0APlease contact me regarding this legal matter.`;
        window.open(`https://wa.me/919454072550?text=${message}`, '_blank');
    } else if (document.getElementById('Consumer-name')) {
        sendPracticeAreaInquiry('Consumer-name', 'Consumer-mobile', 'Consumer-district', 'Consumer-state', 'Consumer-problem', 'Consumer Forum Case Inquiry');
    } else if (document.getElementById('cyber-name')) {
        sendPracticeAreaInquiry('cyber-name', 'cyber-mobile', 'cyber-district', 'cyber-state', 'cyber-problem', 'Cyber Crime Case Inquiry');
    }
}

function sendJJToWhatsApp(event) {
    event.preventDefault();
    const name = getVal('jj-name');
    const mobile = getVal('jj-mobile');
    const district = getVal('jj-district');
    const state = getVal('jj-state');
    const issue = getVal('jj-problem');
    const message = `*Juvenile Legal Assistance Request*%0A%0A` +
        `*Guardian:* ${encodeURIComponent(name)}%0A` +
        `*Mobile:* ${mobile}%0A` +
        `*Location:* ${encodeURIComponent(district)}, ${encodeURIComponent(state)}%0A` +
        `*Urgent Issue:* ${encodeURIComponent(issue)}%0A%0A` +
        `_Please provide immediate legal counsel regarding the minor's rights and bail._`;
    window.open(`https://wa.me/919454072550?text=${message}`, '_blank');
}

function sendMaintenanceToWhatsApp(event) {
    event.preventDefault();
    sendPracticeAreaInquiry('m-name', 'm-mobile', 'm-district', 'm-state', 'm-issue', 'Maintenance Legal Assessment Request');
}

function submitIntakeToWhatsApp(event) {
    event.preventDefault();
    const phone = getVal('intake-phone');
    const email = getVal('intake-email');
    const address = getVal('intake-address');
    const occupation = getVal('intake-occupation');
    const opposingName = getVal('intake-opposing-name');
    const relation = getVal('intake-relation');
    const caseType = getVal('intake-case-type');
    const status = getVal('intake-status');
    const court = getVal('intake-court');
    const nextDate = getVal('intake-date');
    const desc = getVal('intake-desc');

    const message = `*Client Intake Form Submission*%0A%0A` +
        `*Phone:* ${phone}%0A` +
        `*Email:* ${email}%0A` +
        `*Address:* ${encodeURIComponent(address)}%0A` +
        `*Occupation:* ${encodeURIComponent(occupation)}%0A` +
        `*Opposing Party:* ${encodeURIComponent(opposingName)} (${encodeURIComponent(relation)})%0A` +
        `*Case Type:* ${encodeURIComponent(caseType)}%0A` +
        `*Status:* ${encodeURIComponent(status)}%0A` +
        `*Court Name:* ${encodeURIComponent(court)}%0A` +
        `*Next Date:* ${nextDate}%0A` +
        `*Description:* ${encodeURIComponent(desc)}`;

    window.open(`https://wa.me/919454072550?text=${message}`, '_blank');
    return false;
}

function handleFormSubmission(event) {
    event.preventDefault();
    const name = getVal('contact-name');
    const phone = getVal('contact-phone');
    const state = getVal('contact-state');
    const district = getVal('contact-district');
    const category = getVal('contact-area');
    const subCategory = getVal('contact-sub-area');
    const message = getVal('contact-message');

    const formattedMessage = `*Official Chamber Inquiry*%0A%0A` +
        `*Name:* ${encodeURIComponent(name)}%0A` +
        `*Phone:* ${phone}%0A` +
        `*Location:* ${encodeURIComponent(district)}, ${encodeURIComponent(state)}%0A` +
        `*Category:* ${encodeURIComponent(category)} (${encodeURIComponent(subCategory)})%0A` +
        `*Message:* ${encodeURIComponent(message)}`;

    const channel = event.submitter ? event.submitter.value : 'whatsapp';

    if (channel === 'email') {
        const emailSubject = encodeURIComponent("Legal Consultation Request");
        const emailBody = formattedMessage.replace(/\*/g, '').replace(/%0A/g, '\r\n');
        const mailtoURL = `mailto:advgunjanyadav@gmail.com?subject=${emailSubject}&body=${emailBody}`;
        window.location.href = mailtoURL;
    } else {
        const whatsappURL = `https://wa.me/919454072550?text=${formattedMessage}`;
        window.open(whatsappURL, '_blank');
    }
    return false;
}