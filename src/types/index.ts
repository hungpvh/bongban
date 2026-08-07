// Dictionary Types
export interface TableTennisDictionary {
  thong_tin_tran_dau: Record<string, string>;
  tinh_chat_ket_thuc: Record<string, string>;
  ky_thuat: Record<string, string>;
  thuoc_tinh_bong: {
    diem_roi_ngang: Record<string, string>;
    do_dai: Record<string, string>;
    do_xoay: Record<string, string>;
  };
  thuoc_tinh_loi: {
    vi_tri_hong: Record<string, string>;
  };
}

// Data Types
export interface MatchData {
  id_tran_dau: string;
  thong_tin: Record<string, string>;
  chi_tiet_game: GameData[];
}

export interface GameData {
  game_so: number;
  ty_so_bat_dau: string;
  nguoi_giao_bong_truoc: string;
  ty_so_chung_cuoc: string;
  trang_thai: string;
  danh_sach_diem: PointData[];
}

export interface TouchData {
  tinh_chat?: string; // e.g. winner, forced_error
  nguoi_thuc_hien: string;
  ky_thuat: string;
  dac_tinh: {
    diem_roi_ngang: string | null;
    do_dai: string | null;
    do_xoay: string | null;
    vi_tri_hong: string | null;
  };
}

export interface PointData {
  thu_tu_diem: number;
  ty_so_hien_tai: string;
  loai_diem: 'thang' | 'thua';
  nguoi_ghi_diem: string;
  tong_so_cham: number;
  khoi_nguon_giao_bong: TouchData;
  cu_tao_loi_the_N_2: TouchData | null;
  cu_dap_tra_N_1: TouchData | null;
  cu_ket_thuc_N: TouchData | null;
}
