// 백엔드 Case 스키마(app/models.py::Case)에 정확히 일치하는 mock 데이터.
// frontend는 useCases.coerceCase()를 통해 raw 응답을 화면용 Case로 변환한다.

export interface BackendCaseRow {
  id: string;
  title: string;
  analyst: string;
  status: string;
  disk_image_path: string;
  disk_image_format: string;
  created_at: string;
  updated_at: string;
}

export const MOCK_CASES: BackendCaseRow[] = [
  {
    id: 'DF-2026-0425',
    title: '20260425_김영끌_랜섬웨어',
    analyst: '김영끌',
    status: 'running',
    disk_image_path: '/data/cases/DF-2026-0425/disk.E01',
    disk_image_format: 'ewf',
    created_at: '2026-04-25T09:00:00Z',
    updated_at: '2026-05-20T11:32:00Z',
  },
  {
    id: 'DF-2023-0820',
    title: 'USB 저장매체 삭제파일 복구',
    analyst: '이포렌',
    status: 'done',
    disk_image_path: '/data/cases/DF-2023-0820/usb.dd',
    disk_image_format: 'raw',
    created_at: '2023-08-20T13:10:00Z',
    updated_at: '2023-08-22T18:04:00Z',
  },
  {
    id: 'DF-2023-0901',
    title: '이메일 피싱 계정 추적',
    analyst: '박디지',
    status: 'rejected',
    disk_image_path: '/data/cases/DF-2023-0901/disk.E01',
    disk_image_format: 'ewf',
    created_at: '2023-09-01T08:25:00Z',
    updated_at: '2023-09-03T09:11:00Z',
  },
  {
    id: 'DF-2023-0910',
    title: '사내 기밀 유출 타임라인 분석',
    analyst: '김수사',
    status: 'idle',
    disk_image_path: '/data/cases/DF-2023-0910/disk.vmdk',
    disk_image_format: 'vmdk',
    created_at: '2023-09-10T07:00:00Z',
    updated_at: '2023-09-10T07:00:00Z',
  },
];
