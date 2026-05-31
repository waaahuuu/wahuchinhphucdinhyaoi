// ==================== CẤU HÌNH THÔNG TIN GOOGLE SHEETS ====================
const SHEET_ID = '1G6rRcf3--hnji7I4sgpd7kcUHBpG262T9fbSegEcw-8'; 
const SHEET_TITLE = 'Sheet12'; // Kiểm tra kỹ tên tab dưới cùng file Excel của bạn

// Đường dẫn tối ưu tốc độ load, bóp nhỏ dữ liệu để tải mượt hơn
const FULL_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${SHEET_TITLE}&tqx=out:json`;

let mangaList = [];
const mangaGrid = document.getElementById('mangaGrid');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');

async function loadMangaFromSheets() {
    try {
        const response = await fetch(FULL_URL);
        const text = await response.text();
        
        // Bóc tách JSON chuẩn từ Google
        const jsonString = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
        const jsonData = JSON.parse(jsonString);
        const rows = jsonData.table.rows;

        mangaList = rows.map(row => {
            const cells = row.c;
            const getVal = (index) => (cells[index] && cells[index].v !== null) ? cells[index].v : '';

            // Lấy chuỗi thô ở cột Covers (Cột B)
            let rawCover = String(getVal(1)).trim();
            let finalCover = 'https://via.placeholder.com/200x280'; // Ảnh mặc định

            if (rawCover) {
                // Tách link nếu ô có nhiều ảnh (Lấy link đầu tiên)
                let coverArray = rawCover.split(/[\s,]+/);
                if (coverArray[0].startsWith('http')) {
                    finalCover = coverArray[0];
                }
            }

            // ĐỐI CHIẾU CỘT: D(3)=Title, E(4)=Author, F(5)=Tags, H(7)=Publisher, I(8)=Volumes, J(9)=Finish Date
            return {
                image: finalCover,
                title: String(getVal(3)).trim(),
                author: String(getVal(4)).trim(),
                tags: String(getVal(5)).trim(),
                publisher: String(getVal(7)).trim(),
                volumes: getVal(8),
                finishDate: getVal(9)
            };
        }).filter(manga => manga.title && manga.title !== 'TITLE' && manga.title !== ''); 

        displayManga(mangaList);
    } catch (error) {
        mangaGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red; font-weight: bold;">Đang tải dữ liệu thư viện...</p>`;
        console.error(error);
    }
}

function displayManga(list) {
    mangaGrid.innerHTML = '';
    if(list.length === 0) {
        mangaGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #95a5a6;">Không tìm thấy truyện phù hợp.</p>`;
        return;
    }

    list.forEach(manga => {
        const card = document.createElement('div');
        card.classList.add('manga-card');

        let statusClass = 'reading';
        let statusText = 'Đang đọc';
        if (manga.finishDate && manga.finishDate.toString().trim() !== '') {
            statusClass = 'completed';
            statusText = 'Đã xong';
        }

        // Tối ưu hóa việc hiển thị ảnh: nếu lỗi ảnh mạng, tự động đổi sang ảnh trống giữ khung cố định
        card.innerHTML = `
            <div class="cover-container">
                <img src="${manga.image}" alt="${manga.title}" class="manga-cover" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/200x280';">
            </div>
            <div class="manga-info">
                <div>
                    <h3 class="manga-title" title="${manga.title}">${manga.title}</h3>
                    <span class="manga-author">Tác giả: ${manga.author || 'Chưa rõ'}</span>
                </div>
                <div>
                    <div style="margin: 4px 0; display: flex; justify-content: space-between; align-items: center;">
                        <span class="status-tag status-${statusClass}">${statusText}</span>
                        <span style="font-size: 11px; color: #7f8c8d; font-weight: bold;">Tập: ${manga.volumes || '0'}</span>
                    </div>
                    <div style="color: #e67e22; font-size: 11px; font-weight: 500; margin-bottom: 2px;">NXB: ${manga.publisher || 'Chưa rõ'}</div>
                    <div style="color: #7f8c8d; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${manga.tags}">Tags: ${manga.tags || 'Không có'}</div>
                </div>
            </div>
        `;
        mangaGrid.appendChild(card);
    });
}

function filterAndSearchManga() {
    const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    const searchKeyword = searchInput.value.toLowerCase().trim();

    const filteredList = mangaList.filter(manga => {
        const isCompleted = manga.finishDate && manga.finishDate.toString().trim() !== '';
        const matchesFilter = (activeFilter === 'all') || 
                              (activeFilter === 'completed' && isCompleted) || 
                              (activeFilter === 'reading' && !isCompleted);
        
        const matchesSearch = manga.title.toLowerCase().includes(searchKeyword) || 
                              manga.author.toLowerCase().includes(searchKeyword) ||
                              manga.tags.toLowerCase().includes(searchKeyword) ||
                              manga.publisher.toLowerCase().includes(searchKeyword);

        return matchesFilter && matchesSearch;
    });
    displayManga(filteredList);
}

searchInput.addEventListener('input', filterAndSearchManga);
filterButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        filterAndSearchManga();
    });
});

loadMangaFromSheets();