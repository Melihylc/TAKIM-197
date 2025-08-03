// Bu script, sayfanın tüm interaktif işlevselliğini yönetir.

document.addEventListener('DOMContentLoaded', () => {
    // BAŞLANGIÇ AYARLARI VE KÜTÜPHANELER
    if (typeof AOS !== 'undefined') { AOS.init({ duration: 800, once: true }); }

    // Lottie animasyonunu yükler ve başlatır.
    const lottieContainer = document.getElementById('lottie-container');
    if (lottieContainer && typeof lottie !== 'undefined') {
        lottie.loadAnimation({
            container: lottieContainer, 
            renderer: 'svg', 
            loop: true, 
            autoplay: true, 
            path: './heartbeat ECG.json'
        });
    }

    // Yüklenme ekranını gizler.
    const loader = document.getElementById('loader');
    window.addEventListener('load', () => {
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 500);
        }
    });

    // Favicon
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/x-icon';
    favicon.href = '/favicon.ico';
    document.head.appendChild(favicon);

    //HERO BÖLÜMÜ KART SLIDER YÖNETİMİ
    const sliderTitle = document.getElementById('slider-title');
    const sliderDescription = document.getElementById('slider-description');
    const prevButton = document.getElementById('prevCard');
    const nextButton = document.getElementById('nextCard');
    const cards = document.querySelectorAll('.report-icon-card');
    
    let currentIndex = 0;
    let isAnimating = false;

    function updateSlider(newIndex, isNext) {
        if (isAnimating) return;
        isAnimating = true;

        const oldIndex = currentIndex;
        currentIndex = (newIndex + cards.length) % cards.length;

        const oldCard = cards[oldIndex];
        const newCard = cards[currentIndex];
        
        const direction = isNext ? 1 : -1;
        newCard.style.transition = 'none';
        newCard.style.transform = `translateX(${direction * 100}%)`;
        newCard.style.opacity = 0;
        newCard.offsetHeight;

        oldCard.classList.remove('active');

        setTimeout(() => {
            oldCard.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
            newCard.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
            
            oldCard.style.transform = `translateX(${-direction * 100}%)`;
            oldCard.style.opacity = 0;
            
            newCard.style.transform = 'translateX(0)';
            newCard.style.opacity = 1;
            newCard.classList.add('active');

            sliderTitle.innerHTML = newCard.dataset.title;
            sliderDescription.textContent = newCard.dataset.description;
            showForm(newCard.dataset.report);
            
            setTimeout(() => { isAnimating = false; }, 400);
        }, 50);
    }

    prevButton.addEventListener('click', () => updateSlider(currentIndex - 1, false));
    nextButton.addEventListener('click', () => updateSlider(currentIndex + 1, true));
    
    cards.forEach((card, index) => {
        card.addEventListener('click', () => {
            if (index === currentIndex) {
                document.getElementById('analysis').scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                updateSlider(index, index > currentIndex);
            }
        });
    });

    function showForm(reportType) {
        document.querySelectorAll('.report-form-container').forEach(form => form.classList.remove('active'));
        const activeForm = document.getElementById(`${reportType}-form-container`);
        if (activeForm) activeForm.classList.add('active');
    }
    
    function initializeSlider() {
        cards.forEach((card, index) => {
            card.classList.toggle('active', index === 0);
            if (index === 0) {
                sliderTitle.innerHTML = card.dataset.title;
                sliderDescription.textContent = card.dataset.description;
                showForm(card.dataset.report);
            }
        });
    }
    initializeSlider();

    // FORM İŞLEVSELLİĞİ VE HESAPLAMA
    document.querySelectorAll('input[type="range"]').forEach(input => {
        const valueSpan = document.getElementById(`${input.id}-value`);
        if (valueSpan) valueSpan.textContent = input.value;
        input.addEventListener('input', (e) => { if (valueSpan) valueSpan.textContent = e.target.value; });
    });

    document.getElementById('bmi-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const height = parseFloat(document.getElementById('bmi-height').value);
        const weight = parseFloat(document.getElementById('bmi-weight').value);
        const bmiResultDiv = document.getElementById('bmi-result');
        const bmiValueSpan = document.getElementById('bmi-value');
        const bmiCategoryP = document.getElementById('bmi-category');

        if (!height || !weight || height <= 0 || weight <= 0) {
            bmiCategoryP.textContent = "Lütfen boy ve kilo alanlarını doğru bir şekilde doldurun.";
            bmiCategoryP.style.color = "#e74c3c";
            bmiResultDiv.style.display = 'block';
            return;
        }

        const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
        bmiValueSpan.textContent = bmi;
        let category = '', color = '';
        if (bmi < 18.5) { category = 'Zayıf'; color = '#3498db'; }
        else if (bmi < 24.9) { category = 'Normal Kilolu'; color = '#2ecc71'; }
        else if (bmi < 29.9) { category = 'Fazla Kilolu'; color = '#f1c40f'; }
        else { category = 'Obez'; color = '#e74c3c'; }
        bmiCategoryP.textContent = category;
        bmiCategoryP.style.color = color;
        bmiResultDiv.style.display = 'block';
    });

    document.querySelectorAll('form[id$="-health-form"]').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const reportType = form.id.replace('-health-form', '');
            if (validateForm(form, reportType)) {
                let riskPercentage = 0;
                switch(reportType) {
                    case 'asthma': riskPercentage = calculateAsthmaRisk(form); break;
                    case 'obesity': riskPercentage = calculateObesityRisk(form); break;
                    case 'alzheimer': riskPercentage = calculateAlzheimerRisk(form); break;
                    case 'general': riskPercentage = calculateGeneralHealthRisk(form); break;
                }
                showRiskReport(riskPercentage, reportType);
            }
        });
    });

    function validateForm(form, reportType) {
        let isValid = true;
        form.querySelectorAll('input[type="range"], select, input[type="text"], input[type="email"], textarea').forEach(input => {
            if (input.required && (!input.value || input.value.trim() === '')) {
                isValid = false;
            }
        });
        if (!isValid) showRiskReport(-1, reportType);
        return isValid;
    }

    // RİSK HESAPLAMA FONKSİYONLARI
    function getValue(form, id) {
        const el = form.querySelector(`#${id}`);
        if (!el) return 0;
        if (el.type === 'checkbox') return el.checked;
        if (el.type === 'range' || el.type === 'number') return parseFloat(el.value);
        if (el.tagName === 'SELECT') return el.value;
        return 0;
    }

    // Astım için dinamik puanlama
    function calculateAsthmaRisk(form) { 
        let score = 0; 
        const totalWeight = 100;
        
        // Form verilerini alma
        const age = getValue(form, 'asthma-Age');
        const familyHistory = getValue(form, 'asthma-Family_History');
        const smoking = getValue(form, 'asthma-Smoking');
        const wheezing = getValue(form, 'asthma-Wheezing');
        const nighttimeSymptoms = getValue(form, 'asthma-NighttimeSymptoms');
        const exerciseInduced = getValue(form, 'asthma-ExerciseInduced');
        const reflux = getValue(form, 'asthma-GastroesophagealReflux');
        const eczema = getValue(form, 'asthma-Eczema');
        const hayFever = getValue(form, 'asthma-HayFever');
        const petAllergy = getValue(form, 'asthma-PetAllergy');
        const pollenExposure = getValue(form, 'asthma-PollenExposure');
        const fev1 = getValue(form, 'asthma-LungFunctionFEV1');
        const fvc = getValue(form, 'asthma-LungFunctionFVC');
        
        // Dinamik puanlama
        if (familyHistory) score += 20;
        if (smoking) score += 15;
        if (wheezing) score += 15;
        if (nighttimeSymptoms) score += 10;
        if (exerciseInduced) score += 10;
        if (reflux) score += 5;
        if (eczema) score += 5;
        if (hayFever) score += 5;
        if (petAllergy) score += 5;

        // Yaş puanlaması
        if (age > 60) score += 10;
        else if (age < 15) score += 5;

        // Polen maruziyeti (1-10)
        score += (pollenExposure * 1);

        // Akciğer fonksiyonu puanlaması (FEV1, FVC)
        if (fev1 < 5) score += 10;
        if (fvc < 5) score += 10;
        
        // Normalize edilmiş risk yüzdesi
        const maxPossibleScore = 120; // Puanların toplamı
        return Math.min(100, Math.round((score / maxPossibleScore) * 100));
    }


    // Obezite için puanlama
    function calculateObesityRisk(form) {
        let score = 0;
        let totalWeight = 0;
        
        const height = getValue(form, 'obesity-Height');
        const weight = getValue(form, 'obesity-Weight');
        
        if (height === 0 || weight === 0) return 0;
        
        const bmi = (weight / (height * height));
        
        // BMI'a göre puanlama
        if (bmi < 18.5) { 
            score += 5;
        } else if (bmi < 24.9) { 
            score += 10;
        } else if (bmi < 29.9) {
            score += 30;
        } else if (bmi < 34.9) {
            score += 50;
        } else if (bmi < 39.9) {
            score += 70;
        } else {
            score += 90;
        }
        totalWeight += 100;
        
        score += getValue(form, 'obesity-family_history_with_overweight') ? 30 : 0;
        totalWeight += 30;

        score += getValue(form, 'obesity-FAVC') ? 15 : 0;
        totalWeight += 15;
        
        score += (3 - getValue(form, 'obesity-FAF')) * 10;
        totalWeight += 30;
        
        score += (4 - getValue(form, 'obesity-NCP')) * 5;
        totalWeight += 15;
        
        score += (getValue(form, 'obesity-CAEC') !== 'no') ? 15 : 0;
        totalWeight += 15;

        score += (getValue(form, 'obesity-SMOKE') === 'yes') ? 20 : 0;
        totalWeight += 20;

        score += (getValue(form, 'obesity-CH2O') < 2) ? 10 : 0;
        totalWeight += 10;

        score += (getValue(form, 'obesity-TUE') > 1) ? 10 : 0;
        totalWeight += 10;

        score += (getValue(form, 'obesity-CALC') !== 'no') ? 10 : 0;
        totalWeight += 10;
        
        score += (getValue(form, 'obesity-MTRANS') !== 'Walking' && getValue(form, 'obesity-MTRANS') !== 'Bike') ? 10 : 0;
        totalWeight += 10;

        score += (getValue(form, 'obesity-SCC') === 'no') ? 5 : 0;
        totalWeight += 5;

        return Math.min(100, Math.max(0, Math.round((score / totalWeight) * 100)));
    }

    // Alzheimer için puanlama
    function calculateAlzheimerRisk(form) { 
        let score = 0;
        let totalWeight = 0;
        
        const age = getValue(form, 'alzheimer-Age');
        if (age > 80) score += 40;
        else if (age > 65) score += 25;
        totalWeight += 40;

        score += getValue(form, 'alzheimer-FamilyHistoryAlzheimers') ? 30 : 0;
        totalWeight += 30;

        score += getValue(form, 'alzheimer-CardiovascularDisease') ? 15 : 0;
        totalWeight += 15;
        
        score += getValue(form, 'alzheimer-Hypertension') ? 15 : 0;
        totalWeight += 15;
        
        score += getValue(form, 'alzheimer-Diabetes') ? 15 : 0;
        totalWeight += 15;
        
        score += getValue(form, 'alzheimer-MemoryComplaints') ? 20 : 0;
        totalWeight += 20;
        
        const mmse = getValue(form, 'alzheimer-MMSE');
        if (mmse < 24) score += 30;
        else if (mmse < 27) score += 15;
        totalWeight += 30;

        return Math.min(100, Math.round((score / totalWeight) * 100));
    }

    // Genel sağlık için puanlama
    function calculateGeneralHealthRisk(form) { 
        let score = 0;
        let totalWeight = 100;
        
        const bmi = getValue(form, 'general-BMI');
        if (bmi > 25 || bmi < 18.5) score += 25;
        
        score += getValue(form, 'general-Smoking') ? 20 : 0;
        
        score += (10 - getValue(form, 'general-PhysicalActivity')) * 2.5;
        score += (10 - getValue(form, 'general-DietQuality')) * 2.5;
        score += (getValue(form, 'general-StressLevel')) * 2.5;
        
        return Math.min(100, Math.round((score / 100) * 100));
    }


    // RİSK RAPORU GÖSTERİMİ
    const riskCharts = {};
    function showRiskReport(percentage, reportType) {
        const resultDiv = document.querySelector(`#${reportType}-form-container .result`);
        const riskLevelText = document.getElementById(`${reportType}-risk-level-text`);
        const riskSuggestions = document.getElementById(`${reportType}-risk-suggestions`);
        const gaugeWrapper = resultDiv.querySelector('.gauge-wrapper');
        
        if (percentage === -1) {
            if (gaugeWrapper) gaugeWrapper.style.display = 'none';
            if (riskLevelText) riskLevelText.textContent = '';
            if (riskSuggestions) {
                riskSuggestions.textContent = 'Lütfen tüm zorunlu alanları doldurarak tekrar deneyin.';
                riskSuggestions.style.color = '#e74c3c';
            }
            if (resultDiv) resultDiv.style.display = 'block';
            return;
        }

        if (gaugeWrapper) gaugeWrapper.style.display = 'block';
        if (riskSuggestions) riskSuggestions.style.color = '';

        let level = '', color = '', message = '';
        if (percentage < 40) { level = 'Düşük Risk'; color = '#2ecc71'; message = 'Harika! Sağlık verileriniz genel olarak iyi durumda. Mevcut sağlıklı yaşam tarzınızı sürdürmeye devam edin.'; }
        else if (percentage < 70) { level = 'Orta Risk'; color = '#f1c40f'; message = 'Dikkat! Bazı faktörler riskinizi artırıyor. Yaşam tarzınızda küçük değişiklikler yaparak sağlığınızı önemli ölçüde iyileştirebilirsiniz.'; }
        else { level = 'Yüksek Risk'; color = '#e74c3c'; message = 'Önemli! Sonuçlarınız, bu sağlık durumu için yüksek risk altında olduğunuzu gösteriyor. Bir sağlık profesyoneline danışmanız ve yaşam tarzınızda önemli değişiklikler yapmanız önerilir.'; }
        riskLevelText.textContent = level;
        riskLevelText.style.color = color;
        riskSuggestions.textContent = message;

        const canvasId = `${reportType}-riskDonutChart`;
        if (riskCharts[reportType]) riskCharts[reportType].destroy();
        const ctx = document.getElementById(canvasId).getContext('2d');
        riskCharts[reportType] = new Chart(ctx, { type: 'doughnut', data: { datasets: [{ data: [percentage, 100 - percentage], backgroundColor: [color, '#E9ECEF'], borderWidth: 0, circumference: 180, rotation: -90 }] }, options: { responsive: true, maintainAspectRatio: true, cutout: '80%', plugins: { tooltip: { enabled: false } } } });
        
        const gaugePercent = document.getElementById(`${reportType}-gaugePercentage`);
        if (gaugePercent) { gaugePercent.textContent = `${percentage}%`; gaugePercent.style.color = color; }
        resultDiv.style.display = 'block';
    }

    // GEMINI CHATBOT ENTEGRASYONU
    const chatIcon = document.getElementById('gemini-chat-icon');
    const chatContainer = document.getElementById('gemini-chat-container');
    const minimizeChatBtn = document.getElementById('minimize-chat-btn');
    const closeChatBtn = document.getElementById('close-chat-btn'); 
    const chatMessages = document.getElementById('gemini-chat-messages');
    const chatInput = document.getElementById('gemini-chat-prompt');
    const chatSendBtn = document.getElementById('gemini-chat-send-button');

    const API_KEY = "AIzaSyDk8shO91moWYst90mKnp-m4RQXMLnhMVA";
    
    // Chatbot'u açma/kapama ve küçültme
    chatIcon.addEventListener('click', () => {
        chatContainer.classList.remove('minimized', 'hidden');
        chatIcon.style.display = 'none';
        chatIcon.classList.remove('waiting');
    });

    minimizeChatBtn.addEventListener('click', () => {
        chatContainer.classList.add('minimized');
        chatIcon.style.display = 'flex';
    });
    
    closeChatBtn.addEventListener('click', () => {
        chatContainer.classList.add('hidden');
        chatIcon.style.display = 'flex';
    });
    
    document.querySelectorAll('.gemini-comment-btn').forEach(button => {
        button.addEventListener('click', () => {
            const reportType = button.dataset.report;
            const form = document.getElementById(`${reportType}-health-form`);
            if (validateForm(form, reportType)) {
                let riskPercentage = 0;
                let formDataString = '';
                form.querySelectorAll('input[type="range"], select, input[type="text"], input[type="email"], textarea').forEach(el => {
                    const labelElement = el.closest('.form-group').querySelector('label');
                    const label = labelElement ? labelElement.textContent.replace(/:.*/, '').trim() : el.id;
                    const value = el.type === 'checkbox' ? (el.checked ? 'Evet' : 'Hayır') : el.value;
                    formDataString += `${label}: ${value}, `;
                });
                
                switch(reportType) {
                    case 'asthma': riskPercentage = calculateAsthmaRisk(form); break;
                    case 'obesity': riskPercentage = calculateObesityRisk(form); break;
                    case 'alzheimer': riskPercentage = calculateAlzheimerRisk(form); break;
                    case 'general': riskPercentage = calculateGeneralHealthRisk(form); break;
                }

                const fullPrompt = `Bir kullanıcı için ${reportType} risk raporu oluşturdum. Sonuç: %${riskPercentage}. Kullanıcının verileri şunlardır: ${formDataString.slice(0, -2)}. Bu verilere göre kullanıcıya kısa ve anlaşılır 2-3 maddelik kişisel tavsiye ver.`;
                
                chatContainer.classList.remove('minimized', 'hidden');
                chatIcon.style.display = 'none';
                
                // Otomatik olarak gönderilecek mesajı ve API çağrısı
                sendMessage("Raporumu yorumlar mısın?", true, fullPrompt); 
            }
        });
    });

    const sendMessage = async (prompt, isAuto = false, apiPrompt = null) => {
        const userMessage = isAuto ? "Raporumu yorumlar mısın?" : prompt;
        if (!userMessage) return;

        addMessageToChat(userMessage, 'user');
        if(!isAuto) chatInput.value = '';
        
       
        addMessageToChat('...', 'bot', true);
        chatIcon.classList.add('waiting');

        try {
            const response = await callGeminiAPI(apiPrompt || prompt);
            updateLastBotMessage(response);
        } catch (error) {
            updateLastBotMessage("Üzgünüm, bir hata oluştu ve isteğiniz işlenemedi. Lütfen daha sonra tekrar deneyin.");
        } finally {
            chatIcon.classList.remove('waiting'); 
        }
    };

    chatSendBtn.addEventListener('click', () => sendMessage(chatInput.value.trim()));
    chatInput.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault(); 
            sendMessage(chatInput.value.trim()); 
        } 
    });
    
    async function callGeminiAPI(prompt) {
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        let retries = 0;
        const maxRetries = 5;
        let delay = 1000;

        while (retries < maxRetries) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Üzgünüm, bir cevap oluşturamadım.";
                    return text;
                } else if (response.status === 429) {
                    retries++;
                    delay *= 2;
                    await new Promise(res => setTimeout(res, delay));
                } else {
                    const errorData = await response.json();
                    console.error("API yanıtı başarısız oldu:", response.status, errorData);
                    throw new Error(`API yanıtı başarısız oldu: ${response.status} - ${errorData.error.message}`);
                }
            } catch (error) {
                console.error("Gemini API hatası:", error);
                if (retries >= maxRetries - 1) {
                    return "Üzgünüm, bir hata oluştu ve isteğiniz işlenemedi. Lütfen daha sonra tekrar deneyin.";
                }
                retries++;
                delay *= 2;
                await new Promise(res => setTimeout(res, delay));
            }
        }
        return "Üzgünüm, bir hata oluştu ve isteğiniz işlenemedi.";
    }
    
    function addMessageToChat(text, sender, isLoading = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        
        const profilePic = document.createElement('img');
        profilePic.src = './gemini_icon.svg'; 
        profilePic.alt = 'Gemini';
        profilePic.classList.add('chat-profile-pic');
        
        if (isLoading) {
            messageDiv.innerHTML = '';
            messageDiv.classList.add('loading');
            messageDiv.appendChild(profilePic); 
            const loadingIndicator = document.createElement('div');
            loadingIndicator.classList.add('typing-indicator');
            loadingIndicator.innerHTML = '<span></span><span></span><span></span>';
            messageDiv.appendChild(loadingIndicator);
        } else {
            messageDiv.innerHTML = '';
            messageDiv.appendChild(profilePic);
            const messageTextSpan = document.createElement('span');
            messageTextSpan.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
            messageDiv.appendChild(messageTextSpan);
        }
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updateLastBotMessage(text) {
        const loadingMessage = chatMessages.querySelector('.loading');
        if (loadingMessage) {
            loadingMessage.innerHTML = '';
            loadingMessage.classList.remove('loading');
            
            const profilePic = document.createElement('img');
            profilePic.src = './gemini_icon.svg'; 
            profilePic.alt = 'Gemini';
            profilePic.classList.add('chat-profile-pic');
            loadingMessage.appendChild(profilePic);

            let i = 0;
            const speed = 20;
            const textWithBreaks = text.replace(/\n/g, '<br>');
            const contentSpan = document.createElement('span');
            loadingMessage.appendChild(contentSpan);

            function typeWriter() {
                if (i < textWithBreaks.length) {
                    if (textWithBreaks.charAt(i) === '<') {
                        const closingTagIndex = textWithBreaks.indexOf('>', i);
                        if (closingTagIndex !== -1) {
                            contentSpan.innerHTML += textWithBreaks.substring(i, closingTagIndex + 1);
                            i = closingTagIndex + 1;
                        } else {
                            contentSpan.innerHTML += textWithBreaks.charAt(i);
                            i++;
                        }
                    } else {
                        contentSpan.innerHTML += textWithBreaks.charAt(i);
                        i++;
                    }
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    setTimeout(typeWriter, speed);
                } else {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }
            typeWriter();
        }
    }
});
