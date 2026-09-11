export const MOCK_DICTIONARY = {
  "thong_tin_tran_dau": {
    "ngay_thi_dau": "Ngày thi đấu",
    "loai_hinh": "Loại hình (Giao hữu / Đánh bia / Giải đấu)",
    "doi_thu_1": "Tên của bạn",
    "doi_thu_2": "Tên đối thủ",
    "chap_bong": "Thông tin chấp bóng",
    "ket_qua": "Tỷ số chung cuộc",
    "mo_ta": "Ghi chú & Phân tích trận đấu",
    "link_youtube": "Video YouTube",
    "link_facebook": "Video Facebook",
    "link_khac": "Video lưu trữ khác"
  },
  "tinh_chat_ket_thuc": {
    "winner": "Điểm trực tiếp",
    "unforced_error": "Lỗi tự đánh hỏng",
    "forced_error": "Lỗi bị ép đánh hỏng"
  },
  "ky_thuat": {
    "giao_bong_thuan": "Giao bóng con lắc (Pendulum)",
    "giao_bong_trai": "Giao bóng trái tay",
    "giao_bong_con_lac_nguoc": "Giao bóng con lắc ngược (Reverse Pendulum)",
    "giao_bong_duc": "Giao bóng đục",
    "giao_bong_tomahawk": "Giao bóng Tomahawk",
    "giat_phai": "Giật phải",
    "doi_cong_phai": "Đôi công phải",
    "flick_phai": "Flick / Hất phải",
    "giat_trai": "Giật trái",
    "doi_cong_trai": "Đôi công trái",
    "flick_trai": "Flick / Hất trái",
    "bat_dap_bong": "Bạt / Đập",
    "doi_giat_xa_ban": "Đối giật xa bàn",
    "phong_thu_phai": "Phòng thủ / Kê chặn phải",
    "phong_thu_trai": "Phòng thủ / Kê chặn trái",
    "go_day_bong": "Gò / Cắt / Đẩy",
    "bat_ngan_tha_long": "Bắt ngắn / Thả lỏng",
    "cau_bong_bong": "Câu bóng bổng",
    "loi_khac": "Lỗi khác (Giao hỏng, di chuyển...)"
  },
  "thuoc_tinh_bong": {
    "diem_roi_ngang": {
      "trai": "Trái tay (Backhand)",
      "giua": "Giữa bàn (Middle)",
      "phai": "Phải tay (Forehand)"
    },
    "do_dai": {
      "ngan": "Ngắn (2 nảy)",
      "dai": "Dài"
    },
    "do_xoay": {
      "xuong": "Xoáy xuống",
      "len": "Xoáy lên",
      "long": "Bóng lỏng"
    }
  },
  "thuoc_tinh_loi": {
    "vi_tri_hong": {
      "ruc_luoi": "Rúc lưới",
      "ra_ngoai_dai": "Ra ngoài cạnh đáy",
      "ra_ngoai_bien": "Ra ngoài cạnh bên",
      "truot_bong": "Đánh hụt"
    }
  }
};

export const MOCK_MATCHES = [
  {
    "id_tran_dau": "match_1785756349878",
    "thong_tin": {
      "ngay_thi_dau": "2026-08-02",
      "loai_hinh": "Thi đấu giải",
      "doi_thu_1": "Hungpv",
      "doi_thu_2": "Nghiêm Xuân Hùng",
      "chap_bong": "",
      "ket_qua": "1-3",
      "mo_ta": "Giải BIDV HO Happy Day 2026",
      "link_youtube": "https://www.youtube.com/watch?v=h5DqPOEvZ-8&list=PLWmY-8pplD9A",
      "link_facebook": "",
      "link_khac": ""
    },
    "chi_tiet_game": [
      {
        "game_so": 1,
        "ty_so_bat_dau": "0-0",
        "nguoi_giao_bong_truoc": "Nghiêm Xuân Hùng",
        "ty_so_chung_cuoc": "11-8",
        "trang_thai": "hoan_thanh",
        "danh_sach_diem": [
          {
            "thu_tu_diem": 1,
            "ty_so_hien_tai": "1-0",
            "loai_diem": "thang",
            "nguoi_ghi_diem": "Hungpv",
            "tong_so_cham": 3,
            "khoi_nguon_giao_bong": {
              "nguoi_thuc_hien": "Nghiêm Xuân Hùng",
              "ky_thuat": "giao_bong_thuan",
              "dac_tinh": {
                "diem_roi_ngang": "phai",
                "do_dai": "ngan",
                "do_xoay": "xuong",
                "vi_tri_hong": null
              }
            },
            "cu_tao_loi_the_N_2": null,
            "cu_dap_tra_N_1": {
              "nguoi_thuc_hien": "Hungpv",
              "ky_thuat": "go_day_bong",
              "dac_tinh": {
                "diem_roi_ngang": "trai",
                "do_dai": "dai",
                "do_xoay": "xuong",
                "vi_tri_hong": null
              }
            },
            "cu_ket_thuc_N": {
              "tinh_chat": "forced_error",
              "nguoi_thuc_hien": "Nghiêm Xuân Hùng",
              "ky_thuat": "giat_phai",
              "dac_tinh": {
                "diem_roi_ngang": null,
                "do_dai": null,
                "do_xoay": null,
                "vi_tri_hong": "ruc_luoi"
              }
            }
          },
          {
            "thu_tu_diem": 2,
            "ty_so_hien_tai": "1-1",
            "loai_diem": "thua",
            "nguoi_ghi_diem": "Nghiêm Xuân Hùng",
            "tong_so_cham": 4,
            "khoi_nguon_giao_bong": {
              "nguoi_thuc_hien": "Nghiêm Xuân Hùng",
              "ky_thuat": "giao_bong_thuan",
              "dac_tinh": {
                "diem_roi_ngang": "giua",
                "do_dai": "ngan",
                "do_xoay": "xuong",
                "vi_tri_hong": null
              }
            },
            "cu_tao_loi_the_N_2": {
              "nguoi_thuc_hien": "Nghiêm Xuân Hùng",
              "ky_thuat": "bat_ngan_tha_long",
              "dac_tinh": {
                "diem_roi_ngang": "giua",
                "do_dai": "ngan",
                "do_xoay": "xuong",
                "vi_tri_hong": null
              }
            },
            "cu_dap_tra_N_1": {
              "nguoi_thuc_hien": "Nghiêm Xuân Hùng",
              "ky_thuat": "go_day_bong",
              "dac_tinh": {
                "diem_roi_ngang": "trai",
                "do_dai": "dai",
                "do_xoay": "xuong",
                "vi_tri_hong": null
              }
            },
            "cu_ket_thuc_N": {
              "tinh_chat": "unforced_error",
              "nguoi_thuc_hien": "Hungpv",
              "ky_thuat": "doi_cong_trai",
              "dac_tinh": {
                "diem_roi_ngang": null,
                "do_dai": null,
                "do_xoay": null,
                "vi_tri_hong": "ra_ngoai_dai"
              }
            }
          }
        ]
      }
    ]
  },
  {
    "id_tran_dau": "match_1788924687071",
    "thong_tin": {
      "ngay_thi_dau": "2026-09-06",
      "loai_hinh": "Thi đấu giải",
      "doi_thu_1": "Hungpv",
      "doi_thu_2": "Vũ Kim Ngọc",
      "chap_bong": "Kim Ngọc chấp 2",
      "ket_qua": "2-3",
      "mo_ta": "Giải Đức Lê chich bông 2026",
      "link_youtube": "https://www.youtube.com/watch?v=l875NukOgxU",
      "link_facebook": "",
      "link_khac": ""
    },
    "chi_tiet_game": [
      {
        "id_game": "game_1788925277208",
        "game_so": 1,
        "ty_so_bat_dau": "2-0",
        "nguoi_giao_bong_truoc": "Vũ Kim Ngọc",
        "ty_so_chung_cuoc": "3-2",
        "trang_thai": "dang_danh",
        "danh_sach_diem": [
          {
            "thu_tu_diem": 1,
            "ty_so_hien_tai": "2-1",
            "loai_diem": "thua",
            "nguoi_ghi_diem": "Vũ Kim Ngọc",
            "tong_so_cham": 2,
            "nguoi_giao_bong": "Vũ Kim Ngọc",
            "khoi_nguon_giao_bong": {
              "nguoi_thuc_hien": "Vũ Kim Ngọc",
              "ky_thuat": "giao_bong_duc",
              "dac_tinh": {
                "diem_roi_ngang": "phai",
                "do_dai": "dai",
                "do_xoay": "xuong",
                "vi_tri_hong": null
              }
            },
            "cu_tao_loi_the_N_2": null,
            "cu_dap_tra_N_1": null,
            "cu_ket_thuc_N": {
              "tinh_chat": "forced_error",
              "nguoi_thuc_hien": "Hungpv",
              "ky_thuat": "giat_phai",
              "dac_tinh": {
                "diem_roi_ngang": null,
                "do_dai": null,
                "do_xoay": "len",
                "vi_tri_hong": "ruc_luoi"
              }
            }
          },
          {
            "thu_tu_diem": 2,
            "ty_so_hien_tai": "3-1",
            "loai_diem": "thua",
            "nguoi_ghi_diem": "Hungpv",
            "tong_so_cham": 3,
            "nguoi_giao_bong": "Vũ Kim Ngọc",
            "khoi_nguon_giao_bong": {
              "nguoi_thuc_hien": "Vũ Kim Ngọc",
              "ky_thuat": "giao_bong_duc",
              "dac_tinh": {
                "diem_roi_ngang": "giua",
                "do_dai": "ngan",
                "do_xoay": "xuong",
                "vi_tri_hong": null
              }
            },
            "cu_tao_loi_the_N_2": null,
            "cu_dap_tra_N_1": {
              "nguoi_thuc_hien": "Hungpv",
              "ky_thuat": "go_day_bong",
              "dac_tinh": {
                "diem_roi_ngang": "trai",
                "do_dai": "dai",
                "do_xoay": "xuong",
                "vi_tri_hong": null
              }
            },
            "cu_ket_thuc_N": {
              "tinh_chat": "forced_error",
              "nguoi_thuc_hien": "Vũ Kim Ngọc",
              "ky_thuat": "giat_trai",
              "dac_tinh": {
                "diem_roi_ngang": null,
                "do_dai": null,
                "do_xoay": "len",
                "vi_tri_hong": "truot_bong"
              }
            }
          },
          {
            "thu_tu_diem": 3,
            "ty_so_hien_tai": "3-2",
            "loai_diem": "thua",
            "nguoi_ghi_diem": "Vũ Kim Ngọc",
            "tong_so_cham": 3,
            "nguoi_giao_bong": "Hungpv",
            "khoi_nguon_giao_bong": {
              "nguoi_thuc_hien": "Hungpv",
              "ky_thuat": "giao_bong_thuan",
              "dac_tinh": {
                "diem_roi_ngang": "trai",
                "do_dai": "dai",
                "do_xoay": "xuong",
                "vi_tri_hong": null
              }
            },
            "cu_tao_loi_the_N_2": null,
            "cu_dap_tra_N_1": {
              "nguoi_thuc_hien": "Vũ Kim Ngọc",
              "ky_thuat": "go_day_bong",
              "dac_tinh": {
                "diem_roi_ngang": "giua",
                "do_dai": "dai",
                "do_xoay": "xuong",
                "vi_tri_hong": null
              }
            },
            "cu_ket_thuc_N": {
              "tinh_chat": "forced_error",
              "nguoi_thuc_hien": "Hungpv",
              "ky_thuat": "giat_phai",
              "dac_tinh": {
                "diem_roi_ngang": null,
                "do_dai": null,
                "do_xoay": "len",
                "vi_tri_hong": "ruc_luoi"
              }
            }
          }
        ]
      }
    ]
  }
];
