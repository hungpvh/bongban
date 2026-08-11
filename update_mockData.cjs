const fs = require('fs');

const richerMockData = `
export const MOCK_DICTIONARY = {
  kieu_giao_bong: ["Xoáy xuống", "Xoáy lên", "Xoáy ngang", "Không lực", "Giao bóng chuội"],
  kieu_danh: ["Gò bóng", "Giật bóng", "Cắt bóng", "Bạt bóng", "Chặn đẩy", "Flick", "Lốp bóng"],
  loai_loi: ["Forced Error", "Unforced Error", "Winner"],
  diem_roi: ["Ngắn Trái", "Ngắn Giữa", "Ngắn Phải", "Dài Trái", "Dài Giữa", "Dài Phải"]
};

export const MOCK_MATCHES = [
  {
    id_tran_dau: "mock-match-1",
    thong_tin: {
      ngay_thi_dau: "2024-05-10",
      loai_hinh: "Giao hữu",
      doi_thu_1: "Hungpv",
      doi_thu_2: "Tuan",
      chap_bong: "Không chấp",
      ket_qua: "3-1",
      mo_ta: "Trận đấu thử nghiệm hệ thống"
    },
    chi_tiet_game: [
      {
        id_game: "mock-game-1",
        game_so: 1,
        ty_so_bat_dau: "0-0",
        nguoi_giao_bong_truoc: "Hungpv",
        ty_so_chung_cuoc: "11-9",
        danh_sach_diem: [
          {
            id_diem: "pt-1",
            loai_diem: "thang",
            khoi_nguon_giao_bong: { kieu_giao_bong: "Xoáy xuống", diem_roi: "Ngắn Trái", nguoi_thuc_hien: "Hungpv" },
            n_minus_2: null,
            n_minus_1: null,
            n: { nguoi_danh: "Hungpv", nguoi_do: "Tuan", kieu_danh: "Flick", diem_roi: "Dài Phải", loai_loi: "Winner" },
            ty_so_hien_tai: "1-0"
          },
          {
            id_diem: "pt-2",
            loai_diem: "thua",
            khoi_nguon_giao_bong: { kieu_giao_bong: "Xoáy ngang", diem_roi: "Ngắn Phải", nguoi_thuc_hien: "Hungpv" },
            n_minus_2: null,
            n_minus_1: { nguoi_do: "Hungpv", kieu_danh: "Gò bóng", diem_roi: "Ngắn Giữa" },
            n: { nguoi_danh: "Tuan", nguoi_do: "Hungpv", kieu_danh: "Giật bóng", diem_roi: "Dài Trái", loai_loi: "Winner" },
            ty_so_hien_tai: "1-1"
          },
          {
            id_diem: "pt-3",
            loai_diem: "thang",
            khoi_nguon_giao_bong: { kieu_giao_bong: "Không lực", diem_roi: "Ngắn Giữa", nguoi_thuc_hien: "Tuan" },
            n_minus_2: { nguoi_do: "Hungpv", kieu_danh: "Gò bóng", diem_roi: "Ngắn Trái" },
            n_minus_1: { nguoi_do: "Tuan", kieu_danh: "Giật bóng", diem_roi: "Dài Trái" },
            n: { nguoi_danh: "Hungpv", nguoi_do: "Tuan", kieu_danh: "Chặn đẩy", diem_roi: "Ngắn Phải", loai_loi: "Winner" },
            ty_so_hien_tai: "2-1"
          },
          {
            id_diem: "pt-4",
            loai_diem: "thang",
            khoi_nguon_giao_bong: { kieu_giao_bong: "Xoáy xuống", diem_roi: "Ngắn Trái", nguoi_thuc_hien: "Tuan" },
            n_minus_2: null,
            n_minus_1: null,
            n: { nguoi_danh: "Tuan", nguoi_do: "Hungpv", kieu_danh: "Gò bóng", diem_roi: "Ngắn Trái", loai_loi: "Unforced Error" },
            ty_so_hien_tai: "3-1"
          },
          {
            id_diem: "pt-5",
            loai_diem: "thua",
            khoi_nguon_giao_bong: { kieu_giao_bong: "Xoáy lên", diem_roi: "Dài Phải", nguoi_thuc_hien: "Hungpv" },
            n_minus_2: { nguoi_do: "Tuan", kieu_danh: "Bạt bóng", diem_roi: "Dài Giữa" },
            n_minus_1: { nguoi_do: "Hungpv", kieu_danh: "Chặn đẩy", diem_roi: "Ngắn Phải" },
            n: { nguoi_danh: "Tuan", nguoi_do: "Hungpv", kieu_danh: "Bạt bóng", diem_roi: "Dài Trái", loai_loi: "Winner" },
            ty_so_hien_tai: "3-2"
          }
        ]
      },
      {
        id_game: "mock-game-2",
        game_so: 2,
        ty_so_bat_dau: "0-2",
        nguoi_giao_bong_truoc: "Tuan",
        ty_so_chung_cuoc: "2-4",
        danh_sach_diem: [
            {
                id_diem: "pt-2-1",
                loai_diem: "thang",
                khoi_nguon_giao_bong: { kieu_giao_bong: "Giao bóng chuội", diem_roi: "Dài Phải", nguoi_thuc_hien: "Tuan" },
                n_minus_2: null,
                n_minus_1: null,
                n: { nguoi_danh: "Hungpv", nguoi_do: "Tuan", kieu_danh: "Giật bóng", diem_roi: "Dài Giữa", loai_loi: "Winner" },
                ty_so_hien_tai: "1-2"
            },
            {
                id_diem: "pt-2-2",
                loai_diem: "thang",
                khoi_nguon_giao_bong: { kieu_giao_bong: "Xoáy ngang", diem_roi: "Ngắn Giữa", nguoi_thuc_hien: "Tuan" },
                n_minus_2: null,
                n_minus_1: { nguoi_do: "Hungpv", kieu_danh: "Gò bóng", diem_roi: "Ngắn Phải" },
                n: { nguoi_danh: "Tuan", nguoi_do: "Hungpv", kieu_danh: "Giật bóng", diem_roi: "Dài Trái", loai_loi: "Forced Error" },
                ty_so_hien_tai: "2-2"
            },
            {
                id_diem: "pt-2-3",
                loai_diem: "thua",
                khoi_nguon_giao_bong: { kieu_giao_bong: "Xoáy xuống", diem_roi: "Ngắn Trái", nguoi_thuc_hien: "Hungpv" },
                n_minus_2: null,
                n_minus_1: null,
                n: { nguoi_danh: "Hungpv", nguoi_do: "Tuan", kieu_danh: "Gò bóng", diem_roi: "Ngắn Trái", loai_loi: "Unforced Error" },
                ty_so_hien_tai: "2-3"
            },
            {
                id_diem: "pt-2-4",
                loai_diem: "thua",
                khoi_nguon_giao_bong: { kieu_giao_bong: "Không lực", diem_roi: "Ngắn Trái", nguoi_thuc_hien: "Hungpv" },
                n_minus_2: null,
                n_minus_1: { nguoi_do: "Hungpv", kieu_danh: "Flick", diem_roi: "Dài Giữa" },
                n: { nguoi_danh: "Tuan", nguoi_do: "Hungpv", kieu_danh: "Giật bóng", diem_roi: "Dài Phải", loai_loi: "Winner" },
                ty_so_hien_tai: "2-4"
            }
        ]
      },
      {
        id_game: "mock-game-3",
        game_so: 3,
        ty_so_bat_dau: "2-0",
        nguoi_giao_bong_truoc: "Hungpv",
        ty_so_chung_cuoc: "2-0",
        danh_sach_diem: []
      }
    ]
  }
];
`;

fs.writeFileSync('js/mockData.js', richerMockData.trim());
