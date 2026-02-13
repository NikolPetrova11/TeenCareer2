document.addEventListener('DOMContentLoaded', () => {
    // --- NAVIGATION & POPUP LOGIC ---
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");
    const profileBtn = document.querySelector(".profile-btn");
    const overlay = document.querySelector(".overlay");
    const popup = document.querySelector(".popup");
    const closeBtn = document.querySelector(".popup .close-btn");

    // Toggle mobile menu
    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", () => {
            navMenu.classList.toggle("active");
        });
    }

    // Open popup
    if (profileBtn) {
        profileBtn.addEventListener("click", () => {
            overlay.classList.add("active");
            popup.classList.add("active");
        });
    }

    // Close popup
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            overlay.classList.remove("active");
            popup.classList.remove("active");
        });
    }

    // Close overlay on click
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target.classList.contains("overlay")) {
                overlay.classList.remove("active");
                if (popup) popup.classList.remove("active");
                const cvModal = document.getElementById("cvModal");
                if (cvModal) cvModal.classList.remove("modal-open");
            }
        });
    }

    // Tab switching (Login/Register)
    const tabButtons = document.querySelectorAll(".tab-btn");
    const loginForm = document.querySelector(".login-form-container");
    const registerForm = document.querySelector(".register-form-container");

    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            tabButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            const targetForm = button.getAttribute("data-form");
            if (targetForm === "login") {
                loginForm.classList.add("active");
                registerForm.classList.remove("active");
            } else {
                loginForm.classList.remove("active");
                registerForm.classList.add("active");
            }
        });
    });

    // --- PORTFOLIO LOGIC ---
    const uploadText = document.getElementById('upload-text');
    const uploadInput = document.getElementById('portfolio-upload');
    const downloadText = document.getElementById('download-text');
    const step3Container = document.getElementById('step3-container');
    const dataModal = document.getElementById('data-modal');
    const closeModal = document.getElementById('close-modal');
    const portfolioDataForm = document.getElementById('portfolio-data-form');
    let formDataSubmitted = false;
    const userId = null;

    // Open modal or trigger upload
    if (uploadText) {
        uploadText.addEventListener('click', () => {
            if (!formDataSubmitted) {
                dataModal.style.display = 'block';
            } else {
                uploadInput.click();
            }
        });
    }

    // Close modal
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            dataModal.style.display = 'none';
        });
    }

    // Submit portfolio data
    if (portfolioDataForm) {
        portfolioDataForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(portfolioDataForm);

            fetch('save_session_data.php', { method: 'POST', body: formData })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        formDataSubmitted = true;
                        dataModal.style.display = 'none';
                        uploadText.innerHTML = 'Data saved! <br> **Click to upload file**';
                        uploadText.style.cursor = 'pointer';
                        uploadInput.click();
                    } else {
                        alert('Error saving data.');
                    }
                })
                .catch(error => console.error('Error:', error));
        });
    }

    // Handle file upload
    if (uploadInput) {
        uploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file && formDataSubmitted) {
                uploadText.innerHTML = `Uploaded: ${file.name}<br>Processing...`;
                const uploadFormData = new FormData();
                uploadFormData.append('portfolio_file', file);
                if (userId) uploadFormData.append('user_id', userId);

                fetch('upload_portfolio.php', { method: 'POST', body: uploadFormData })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            uploadText.innerHTML = `Uploaded: ${file.name}<br>✓ Done!`;
                            activateDownloadStep(data.portfolio_id);
                        } else {
                            uploadText.innerHTML = `Error: ${data.error}`;
                        }
                    })
                    .catch(error => console.error('Error:', error));
            } else if (!formDataSubmitted) {
                uploadText.innerHTML = 'Please fill in data first!';
            }
        });
    }

    // Activate download step
    function activateDownloadStep(portfolioId) {
        if (step3Container) step3Container.style.boxShadow = '0 0 20px rgba(9, 152, 158, 0.8)';
        if (downloadText) {
            downloadText.style.color = '#09989e';
            downloadText.style.cursor = 'pointer';
            downloadText.innerHTML = 'CLICK TO DOWNLOAD!';
            downloadText.onclick = () => {
                window.open(`pdf_generator.php?id=${portfolioId}`, '_blank');
                downloadText.textContent = "Download started...";
                setTimeout(() => {
                    downloadText.innerHTML = 'Download again <br> portfolio';
                }, 2000);
            };
        }
    }

    // --- CV MAKER LOGIC ---
    const cvModal = document.getElementById("cvModal");
    const openCvModalBtn = document.getElementById("openCvModalBtn");
    const cvCloseBtn = document.querySelector(".cv-close-btn");
    const cvForm = document.getElementById("cvForm");
    const downloadCvBtn = document.getElementById("downloadCvBtn");
    const templateSelector = document.getElementById("template-selector");
    const cvPaper = document.querySelector(".cv-paper");

    let cvData = {
        template: templateSelector ? (templateSelector.value || 'default') : 'default'
    };

    // Apply template style
    function applyTemplate(templateName) {
        if (!cvPaper) return;
        cvPaper.classList.remove('default', 'modern', 'creative', 'playful');
        if (['modern', 'creative', 'playful'].includes(templateName)) {
            cvPaper.classList.add(templateName);
        } else {
            cvPaper.classList.add('default');
        }
    }

    if (templateSelector) {
        applyTemplate(templateSelector.value);
        templateSelector.addEventListener('change', function() {
            cvData.template = this.value;
            applyTemplate(this.value);
            checkPageHeight();
        });
    }

    // Open CV Modal
    if (openCvModalBtn) {
        openCvModalBtn.addEventListener("click", (e) => {
            e.preventDefault();
            cvModal.classList.add("modal-open");
            overlay.classList.add("active");
            e.stopPropagation();
        });
    }

    // Close CV Modal
    if (cvCloseBtn) {
        cvCloseBtn.addEventListener("click", () => {
            cvModal.classList.remove("modal-open");
            overlay.classList.remove("active");
        });
    }

    // Save CV Data
    if (cvForm) {
        cvForm.addEventListener("submit", (e) => {
            e.preventDefault();
            cvData.fullName = document.getElementById("cv-fullName").value;
            cvData.email = document.getElementById("cv-email").value;
            cvData.phone = document.getElementById("cv-phone").value;
            cvData.city = document.getElementById("cv-city").value;
            cvData.education = document.getElementById("cv-education").value;
            cvData.experience = document.getElementById("cv-experience").value;
            cvData.skills = document.getElementById("cv-skills").value;
            cvData.languages = document.getElementById("cv-languages").value;
            cvData.summary = document.getElementById("cv-summary").value;
            cvData.date = document.getElementById("cv-date").value;
            cvData.text = document.getElementById("cv-text").value;

            alert(`CV data saved with template: ${cvData.template}! Proceed to download.`);
            cvModal.classList.remove("modal-open");
            overlay.classList.remove("active");
        });
    }

    // Download CV PDF
    if (downloadCvBtn) {
        downloadCvBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (!cvData.fullName) {
                alert("Please fill and save data in Step 2 first.");
                return;
            }

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/generate-pdf';
            form.target = '_blank';

            for (const key in cvData) {
                if (cvData.hasOwnProperty(key) && cvData[key] !== undefined) {
                    const hiddenField = document.createElement('input');
                    hiddenField.type = 'hidden';
                    hiddenField.name = key;
                    hiddenField.value = cvData[key];
                    form.appendChild(hiddenField);
                }
            }
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        });
    }

    // Live Preview
    const previewFields = {
        'cv-fullName': 'preview-fullName',
        'cv-email': 'preview-email',
        'cv-phone': 'preview-phone',
        'cv-city': 'preview-city',
        'cv-education': 'preview-education',
        'cv-experience': 'preview-experience',
        'cv-skills': 'preview-skills',
        'cv-languages': 'preview-languages',
        'cv-summary': 'preview-summary',
        'cv-date': 'preview-date',
        'cv-text': 'preview-text'
    };

    const optionalSections = {
        'cv-skills': 'sec-skills',
        'cv-languages': 'sec-languages',
        'cv-summary': 'sec-summary',
        'cv-text': 'sec-text'
    };

    // Second page funktion
    function checkPageHeight() {
        const paper = document.querySelector('.cv-paper');
        if (!paper) return;
        
        // Reset height to auto to measure content correctly
        paper.style.height = 'auto';

        // Remove old markers
        paper.querySelectorAll('.page-break-line').forEach(el => el.remove());
        
        // a4
        const pageHeight = 1122; 
        const totalHeight = paper.scrollHeight;
        
        if (totalHeight > pageHeight) {
            const pages = Math.ceil(totalHeight / pageHeight);
            
            // Force height to full pages
            paper.style.height = (pages * pageHeight) + 'px';

            for (let i = 1; i < pages; i++) {
                const marker = document.createElement('div');
                marker.className = 'page-break-line';
                marker.style.position = 'absolute';
                marker.style.top = (pageHeight * i) + 'px';
                marker.style.left = '0';
                marker.style.width = '100%';
                marker.style.borderTop = '2px dashed #09989e';
                marker.style.opacity = '0.5';
                marker.style.pointerEvents = 'none';
                marker.innerHTML = `<span style="position:absolute; right:10px; top:-20px; color:#09989e; font-size:12px; font-weight:bold;">Край на страница ${i}</span>`;
                paper.appendChild(marker);
            }
        }
    }

    for (const [inputId, previewId] of Object.entries(previewFields)) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);

        if (input && preview) {
            input.addEventListener('input', function() {
                preview.textContent = this.value || (inputId === 'cv-fullName' ? 'Name Surname' : '...');
                if (optionalSections[inputId]) {
                    const sec = document.getElementById(optionalSections[inputId]);
                    if (sec) sec.style.display = this.value.trim() ? 'block' : 'none';
                }
                checkPageHeight(); 
            });
        }
    }

    // Multi-step Form
    let currentStep = 1;
    const totalSteps = 3;
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const steps = document.querySelectorAll('.form-step');

    function showStep(step) {
        steps.forEach(s => s.classList.remove('active'));
        const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
        if (stepEl) stepEl.classList.add('active');

        if (prevBtn) prevBtn.style.visibility = step === 1 ? 'hidden' : 'visible';

        if (step === totalSteps) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'inline-block';
        } else {
            if (nextBtn) nextBtn.style.display = 'inline-block';
            if (submitBtn) submitBtn.style.display = 'none';
        }
    }

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => {
            const currentStepEl = document.querySelector(`.form-step[data-step="${currentStep}"]`);
            const requiredInputs = currentStepEl.querySelectorAll('[required]');
            let valid = true;

            requiredInputs.forEach(input => {
                if (!input.value.trim()) {
                    valid = false;
                    input.style.border = '1px solid red';
                } else {
                    input.style.border = '1px solid #ccc';
                }
            });

            if (valid && currentStep < totalSteps) {
                currentStep++;
                showStep(currentStep);
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                showStep(currentStep);
            }
        });
    }

    // Photo Upload Preview
    const photoInput = document.getElementById('cv-photo');
    const previewPhoto = document.getElementById('preview-photo');

    if (photoInput && previewPhoto) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    previewPhoto.src = event.target.result;
                    previewPhoto.style.display = 'block';
                }
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Smooth Scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});