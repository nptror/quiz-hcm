const fs = require("fs");

const extra = [
  {q:"Theo Hồ Chí Minh, chủ nghĩa Mác-Lênin là gì đối với cách mạng Việt Nam?", opts:{a:"Kim chỉ nam cho hành động",b:"Mục tiêu cuối cùng",c:"Phương tiện tuyên truyền",d:"Lý luận thuần túy"}, ans:"A"},
  {q:"Hồ Chí Minh gia nhập Đảng Cộng sản Pháp vào năm nào?", opts:{a:"1919",b:"1920",c:"1921",d:"1925"}, ans:"B"},
  {q:"Tác phẩm 'Đường Kách Mệnh' của Hồ Chí Minh được viết vào năm nào?", opts:{a:"1925",b:"1926",c:"1927",d:"1930"}, ans:"C"},
  {q:"Theo Hồ Chí Minh, nền tảng của Mặt trận dân tộc thống nhất là khối liên minh nào?", opts:{a:"Công - Nông - Trí thức",b:"Công nhân và Đảng Cộng sản",c:"Nông dân và tiểu tư sản",d:"Tư sản dân tộc và địa chủ yêu nước"}, ans:"A"},
  {q:"Hồ Chí Minh xác định lực lượng chủ yếu của cách mạng Việt Nam là gì?", opts:{a:"Giai cấp công nhân",b:"Giai cấp nông dân",c:"Công - Nông - Trí thức",d:"Toàn thể nhân dân"}, ans:"D"},
  {q:"Theo Hồ Chí Minh, nguyên tắc nào là cơ bản nhất trong xây dựng Đảng?", opts:{a:"Tập trung dân chủ",b:"Kỷ luật tự giác",c:"Phê bình và tự phê bình",d:"Đoàn kết thống nhất"}, ans:"A"},
  {q:"Hồ Chí Minh gửi bản 'Yêu sách của nhân dân An Nam' tới Hội nghị Versailles vào năm nào?", opts:{a:"1918",b:"1919",c:"1920",d:"1921"}, ans:"B"},
  {q:"Theo Hồ Chí Minh, văn hóa có mấy chức năng cơ bản?", opts:{a:"2",b:"3",c:"4",d:"5"}, ans:"C"},
  {q:"Hồ Chí Minh viết tác phẩm 'Nhật ký trong tù' trong khoảng thời gian nào?", opts:{a:"1941-1942",b:"1942-1943",c:"1943-1944",d:"1944-1945"}, ans:"B"},
  {q:"Theo Hồ Chí Minh, 'Cần, Kiệm, Liêm, Chính' là đức tính căn bản của ai?", opts:{a:"Người cán bộ cách mạng",b:"Người chiến sĩ",c:"Người công dân",d:"Người lãnh đạo"}, ans:"A"},
  {q:"Hồ Chí Minh xác định, thời kỳ quá độ lên chủ nghĩa xã hội ở Việt Nam là thời kỳ như thế nào?", opts:{a:"Ngắn",b:"Dài",c:"Trung bình",d:"Không xác định"}, ans:"B"},
  {q:"Theo Hồ Chí Minh, tư tưởng cốt lõi của chủ nghĩa xã hội là gì?", opts:{a:"Làm chủ tư liệu sản xuất",b:"Không còn người bóc lột người",c:"Mọi người được tự do và hạnh phúc",d:"Nhà nước quản lý kinh tế"}, ans:"C"},
  {q:"Theo Hồ Chí Minh, trong xây dựng chủ nghĩa xã hội, nhiệm vụ trọng tâm là gì?", opts:{a:"Phát triển kinh tế",b:"Xây dựng Đảng",c:"Phát triển văn hóa - giáo dục",d:"Bảo vệ an ninh quốc phòng"}, ans:"A"},
  {q:"Năm 1930, Hồ Chí Minh thống nhất các tổ chức cộng sản tại hội nghị ở đâu?", opts:{a:"Quảng Châu, Trung Quốc",b:"Hồng Kông, Trung Quốc",c:"Hà Nội, Việt Nam",d:"Ma Cao, Trung Quốc"}, ans:"B"},
  {q:"Theo Hồ Chí Minh, 'chính sách' là gì?", opts:{a:"Đường lối chiến lược",b:"Cầu nối giữa đường lối và thực tiễn",c:"Biện pháp cụ thể",d:"Mục tiêu phấn đấu"}, ans:"B"},
  {q:"Theo Hồ Chí Minh, phụ nữ chiếm bao nhiêu phần của xã hội?", opts:{a:"Một phần ba",b:"Một phần tư",c:"Một nửa",d:"Hai phần ba"}, ans:"C"},
  {q:"Hồ Chí Minh xác định mục tiêu của cách mạng Việt Nam gồm mấy nội dung?", opts:{a:"Hai: độc lập và tự do",b:"Ba: độc lập, tự do, hạnh phúc",c:"Bốn nội dung",d:"Một: giải phóng dân tộc"}, ans:"B"},
  {q:"Theo Hồ Chí Minh, Nhà nước pháp quyền có đặc trưng gì?", opts:{a:"Quản lý bằng pháp luật",b:"Quản lý bằng đạo đức",c:"Quản lý bằng chỉ thị",d:"Quản lý bằng phong tục"}, ans:"A"},
  {q:"Theo Hồ Chí Minh, tại sao phải thực hiện đại đoàn kết dân tộc?", opts:{a:"Vì dân tộc ta đông người",b:"Vì đó là truyền thống tốt đẹp",c:"Vì đây là nhân tố quyết định thành bại cách mạng",d:"Vì không có đoàn kết sẽ chia rẽ"}, ans:"C"},
  {q:"Hồ Chí Minh viết bản 'Tuyên ngôn Độc lập' vào năm nào?", opts:{a:"1944",b:"1945",c:"1946",d:"1947"}, ans:"B"},
  {q:"Theo Hồ Chí Minh, 'Trung với nước, hiếu với dân' là nội dung của đức tính gì?", opts:{a:"Cần, Kiệm, Liêm, Chính",b:"Yêu nước",c:"Đức tính trước tiên, căn bản nhất của người cán bộ cách mạng",d:"Đoàn kết"}, ans:"C"},
  {q:"Theo Hồ Chí Minh, Đảng Cộng sản Việt Nam là Đảng của ai?", opts:{a:"Giai cấp công nhân",b:"Giai cấp nông dân",c:"Toàn dân tộc Việt Nam",d:"Nhân dân lao động"}, ans:"C"},
  {q:"Hồ Chí Minh đặt tên cho Đảng thành lập năm 1930 là gì?", opts:{a:"Đảng Cộng sản Đông Dương",b:"Đảng Lao động Việt Nam",c:"Đảng Cộng sản Việt Nam",d:"Hội Việt Nam Cách mạng Thanh niên"}, ans:"C"},
  {q:"Theo Hồ Chí Minh, trong phương pháp nghiên cứu, cần quán triệt nguyên tắc gì?", opts:{a:"Lý luận gắn với thực tiễn",b:"Học đi đôi với hành",c:"Thống nhất lý luận và thực tiễn",d:"Kết hợp nghiên cứu và ứng dụng"}, ans:"C"},
  {q:"Năm 1924, Hồ Chí Minh tham dự Đại hội lần thứ mấy của Quốc tế Cộng sản?", opts:{a:"III",b:"IV",c:"V",d:"VI"}, ans:"C"},
  {q:"Theo Hồ Chí Minh, giáo dục có vai trò gì?", opts:{a:"Nâng cao trình độ văn hóa",b:"Đào tạo nhân tài cho đất nước",c:"Bồi dưỡng thế hệ cách mạng cho đời sau",d:"Xóa mù chữ cho nhân dân"}, ans:"C"},
  {q:"Theo Hồ Chí Minh, 'Liêm' có nghĩa là gì?", opts:{a:"Không tham lam",b:"Siêng năng, chăm chỉ",c:"Ngay thẳng, thật thà",d:"Trong sạch, không tham ô"}, ans:"D"},
  {q:"Hồ Chí Minh sáng lập tổ chức nào tại Quảng Châu năm 1925?", opts:{a:"Việt Nam Độc lập Đồng minh",b:"Hội Việt Nam Cách mạng Thanh niên",c:"Tâm Tâm Xã",d:"Đảng Cộng sản Việt Nam"}, ans:"B"},
  {q:"Theo Hồ Chí Minh, 'Dân là gốc' có nghĩa là gì?", opts:{a:"Nhân dân là lực lượng đông đảo nhất",b:"Nhân dân là chủ thể, quyết định mọi thành công",c:"Nhân dân cần được bảo vệ",d:"Nhân dân phải đi theo Đảng"}, ans:"B"},
  {q:"Theo Hồ Chí Minh, đặc trưng bản chất của Nhà nước kiểu mới là gì?", opts:{a:"Nhà nước do Đảng lãnh đạo",b:"Nhà nước của nhân dân, do nhân dân, vì nhân dân",c:"Nhà nước pháp quyền xã hội chủ nghĩa",d:"Nhà nước quản lý kinh tế"}, ans:"B"},
  {q:"Hồ Chí Minh về nước lần đầu tiên sau 30 năm bôn ba vào năm nào?", opts:{a:"1940",b:"1941",c:"1942",d:"1943"}, ans:"B"},
  {q:"Theo Hồ Chí Minh, 'Chính' trong đức tính Cần Kiệm Liêm Chính là gì?", opts:{a:"Chính trực, không gian dối",b:"Chính sách đúng đắn",c:"Chính nghĩa trong chiến đấu",d:"Chính quyền trong tay nhân dân"}, ans:"A"},
  {q:"Theo Hồ Chí Minh, mối quan hệ giữa cách mạng giải phóng dân tộc và cách mạng vô sản là gì?", opts:{a:"Cách mạng giải phóng dân tộc phụ thuộc cách mạng vô sản",b:"Cách mạng giải phóng dân tộc có thể thắng trước rồi giúp cách mạng vô sản",c:"Cách mạng giải phóng dân tộc là một bộ phận của cách mạng vô sản",d:"Hai cuộc cách mạng không liên quan nhau"}, ans:"B"},
  {q:"Theo Hồ Chí Minh, ai là người tạo ra lịch sử?", opts:{a:"Những nhân vật vĩ đại",b:"Giai cấp công nhân",c:"Quần chúng nhân dân",d:"Đảng Cộng sản"}, ans:"C"},
  {q:"Hồ Chí Minh đọc Tuyên ngôn Độc lập tại đâu vào ngày 2/9/1945?", opts:{a:"Quảng trường Ba Đình, Hà Nội",b:"Quảng trường Cách mạng Tháng Tám, Hà Nội",c:"Hoàng thành Thăng Long, Hà Nội",d:"Hồ Tây, Hà Nội"}, ans:"A"},
  {q:"Theo Hồ Chí Minh, để xây dựng chủ nghĩa xã hội thành công, điều kiện tiên quyết là gì?", opts:{a:"Có đường lối đúng đắn",b:"Có lực lượng vật chất đủ mạnh",c:"Phải có con người xã hội chủ nghĩa",d:"Phải có sự giúp đỡ quốc tế"}, ans:"A"},
  {q:"Hồ Chí Minh xuất bản tờ báo 'Le Paria' (Người cùng khổ) tại đâu?", opts:{a:"Anh",b:"Pháp",c:"Liên Xô",d:"Trung Quốc"}, ans:"B"},
  {q:"Theo Hồ Chí Minh, 'Kiệm' có nghĩa là gì?", opts:{a:"Tiết kiệm, không xa xỉ",b:"Siêng năng, chăm chỉ",c:"Ngay thẳng, thật thà",d:"Trong sạch, không tham ô"}, ans:"A"},
  {q:"Hồ Chí Minh coi phê bình và tự phê bình là gì?", opts:{a:"Vũ khí sắc bén để xây dựng Đảng",b:"Biện pháp kỷ luật Đảng",c:"Cách để loại bỏ phần tử xấu",d:"Phương tiện dân chủ trong Đảng"}, ans:"A"},
  {q:"Theo Hồ Chí Minh, tiêu chuẩn đánh giá đạo đức cán bộ là gì?", opts:{a:"Lý luận Mác-Lênin",b:"Thực tiễn đấu tranh cách mạng",c:"Phục vụ nhân dân",d:"Trung thành với Đảng"}, ans:"C"},
  {q:"Theo Hồ Chí Minh, hình thức sở hữu trong thời kỳ quá độ lên chủ nghĩa xã hội ở Việt Nam là gì?", opts:{a:"Sở hữu nhà nước",b:"Sở hữu tập thể",c:"Sở hữu tư nhân",d:"Nhiều hình thức sở hữu"}, ans:"D"},
  {q:"Theo Hồ Chí Minh, điều gì làm nên sức mạnh của Mặt trận dân tộc thống nhất?", opts:{a:"Tổ chức chặt chẽ",b:"Đoàn kết rộng rãi, chặt chẽ, lâu dài",c:"Sự lãnh đạo của Đảng",d:"Lực lượng đông đảo"}, ans:"B"},
  {q:"Theo Hồ Chí Minh, ai phải là người phục vụ nhân dân?", opts:{a:"Cán bộ, đảng viên",b:"Chính phủ",c:"Nhà nước",d:"Tất cả cán bộ, đảng viên và cơ quan nhà nước"}, ans:"D"},
  {q:"Hồ Chí Minh lấy tên 'Nguyễn Ái Quốc' lần đầu vào năm nào?", opts:{a:"1917",b:"1918",c:"1919",d:"1920"}, ans:"C"},
  {q:"Theo Hồ Chí Minh, 'Thương người như thể thương thân' thể hiện điều gì?", opts:{a:"Tinh thần nhân đạo",b:"Tình yêu thương con người",c:"Đạo đức truyền thống",d:"Lòng nhân ái cách mạng"}, ans:"B"},
  {q:"Hồ Chí Minh xác định hình thức nhà nước ở Việt Nam sau Cách mạng Tháng Tám là gì?", opts:{a:"Cộng hòa dân chủ nhân dân",b:"Cộng hòa xã hội chủ nghĩa",c:"Việt Nam Dân chủ Cộng hòa",d:"Dân chủ nhân dân"}, ans:"C"},
  {q:"Hồ Chí Minh xác định, trong thời kỳ quá độ, nền kinh tế có đặc điểm gì?", opts:{a:"Thuần nhất về chế độ sở hữu",b:"Đa dạng về thành phần kinh tế",c:"Sở hữu nhà nước là duy nhất",d:"Kinh tế tập thể là chủ yếu"}, ans:"B"},
  {q:"Theo Hồ Chí Minh, 'Cần' trong đức tính Cần Kiệm Liêm Chính là gì?", opts:{a:"Cần thiết phải làm",b:"Cần kiệm bổ trợ nhau",c:"Siêng năng, cần mẫn, không lười biếng",d:"Cần chú trọng phát triển kinh tế"}, ans:"C"},
  {q:"Theo Hồ Chí Minh, văn hóa được xây dựng trên nền tảng nào?", opts:{a:"Kinh tế phát triển",b:"Lao động sáng tạo của nhân dân",c:"Truyền thống dân tộc",d:"Tiếp thu văn hóa thế giới"}, ans:"B"},
  {q:"Hồ Chí Minh trở thành Chủ tịch nước Việt Nam Dân chủ Cộng hòa lần đầu tiên vào năm nào?", opts:{a:"1944",b:"1945",c:"1946",d:"1947"}, ans:"B"},
];

const questions = extra.map(e => ({question: e.q, options: e.opts, answer: e.ans}));

const parsed = JSON.parse(fs.readFileSync("new_parsed_595.json", "utf8"));

function normalize(text) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 50);
}

const seen = new Set(parsed.map(q => normalize(q.question)));
const newExtras = questions.filter(q => !seen.has(normalize(q.question)));
console.log("Non-duplicate extra: " + newExtras.length);

// Take only what we need to reach 645
const needed = 645 - parsed.length;
console.log("Need " + needed + " more questions");
const toAdd = newExtras.slice(0, needed);
console.log("Adding: " + toAdd.length);

const all = [...parsed, ...toAdd];
console.log("Total: " + all.length);

let output = "";
all.forEach((q, idx) => {
    const id = idx + 1;
    const optKeys = ["a", "b", "c", "d"].filter(k => q.options[k] !== undefined);
    const optionsStr = optKeys
        .map(k => `            "${k}": "${(q.options[k] || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
        .join(",\n");
    const questionEsc = q.question.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    output += `    {\n        "id": ${id},\n        "question": "${questionEsc}",\n        "options": {\n${optionsStr}\n        },\n        "answer": "${q.answer}"\n    },\n`;
});

fs.writeFileSync("final_quiz_data.js", output, "utf8");
console.log("Done! Saved " + all.length + " questions.");
