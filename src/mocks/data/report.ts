// best-case 데모용 최종 보고서 페이로드.
// summary는 1~2줄 한줄요약, report는 마크다운 본문, dfxml은 통합 DFXML.

export const MOCK_REPORT_SUMMARY =
  '2023-09-15 02:30~02:36 (KST) 사이 svchost32.exe(랜섬웨어)에 의해 사용자 문서/사진 142개가 .locked 확장자로 암호화되었고, vssadmin 명령으로 VSS-003~005 3건이 삭제되었으며, Tor exit node 185.220.101.34:8443으로 524KB의 외부 전송이 식별되었습니다. 초기 침투는 9/14 16:30 피싱 메일(security_patch.zip)을 통한 사용자 실행으로 확정됩니다.';

export const MOCK_REPORT_MARKDOWN = `# 침해 사고 분석 보고서 — DF-2026-0425

## 1. Executive Summary
- **사건 분류**: 외부 위협 행위자에 의한 랜섬웨어 침투 + 외부 전송(Exfiltration) 의심
- **사건 발생**: 2023-09-15 02:28:33 KST (RDP 성공) ~ 02:36:44 KST (Tor 외부 전송)
- **피해**: 사용자 문서/사진 **142건** .locked 확장자 변환 (≈ 1.8 GB)
- **anti-forensics**: \`vssadmin delete shadows /all\`로 VSS **3건** 삭제
- **외부 전송 의심**: 185.220.101.34:8443(Tor exit) 524 KB
- **신뢰도**: ★★★★★ — 10개 아티팩트가 동일 타임라인으로 수렴

## 2. 침해 타임라인
| 시각 (KST) | 단계 | 근거 아티팩트 |
|---|---|---|
| 2023-09-14 16:30 | 피싱 메일 수신 (security_patch.zip) | Outlook OST · SHA-256 \`b7e3…9d42\` |
| 2023-09-14 18:22 | free-tools-download.xyz에서 optimizer.zip 다운로드 | Chrome History |
| 2023-09-14 18:25 | PC Optimizer Pro 설치 | Uninstall Key |
| 2023-09-14 23:12 | RDP 4625 실패 (Admin, 192.168.1.105) | Security.evtx |
| 2023-09-15 02:28:33 | RDP 4624 성공 (Admin, Type 10) | Security.evtx |
| 2023-09-15 02:30:55 | \`cmd /c svchost32.exe -encrypt\` 실행 | NTUSER RunMRU |
| 2023-09-15 02:31:44 | svchost32.exe 초기 실행 (Prefetch / UserAssist) | Prefetch · NTUSER |
| 2023-09-15 02:33:15 | report_2023.xlsx → .locked 변환 시작 | $MFT |
| 2023-09-15 02:34:00 | WindowsUpdateCheck 작업 등록(지속성) | Tasks/*.xml |
| 2023-09-15 02:35:22 | family.jpg.locked — 마지막 암호화 이벤트 | $MFT |
| 2023-09-15 02:36:01 | VSS-003~005 삭제 | vssadmin |
| 2023-09-15 02:36:44 | 185.220.101.34:8443으로 524 KB 송신 | pfirewall.log |

## 3. IOC (Indicators of Compromise)
| 종류 | 값 | 비고 |
|---|---|---|
| File | svchost32.exe | \`C:\\Users\\Admin\\svchost32.exe\` |
| File | encrypt_tool.exe | UserAssist run_count=3 |
| Hash | \`b7e3…9d42\` (SHA-256) | security_patch.zip 첨부 |
| URL | https://free-tools-download.xyz/optimizer.zip | 악성 다운로드 |
| IP | 45.33.32.156:443 | C2 beacon |
| IP | 185.220.101.34:8443 | Tor exit · exfiltration |
| Email | hr-notice@company-portal.net | 피싱 발신 |
| Email | support@ms-security-alert.com | 피싱 발신 |
| Task | WindowsUpdateCheck (DAILY 02:00) | 지속성 |

## 4. MITRE ATT&CK 맵핑
- **TA0001 Initial Access** — T1566.001 Spearphishing Attachment
- **TA0002 Execution** — T1204.002 User Execution: Malicious File
- **TA0003 Persistence** — T1053.005 Scheduled Task
- **TA0005 Defense Evasion** — T1490 Inhibit System Recovery (vssadmin)
- **TA0040 Impact** — T1486 Data Encrypted for Impact
- **TA0010 Exfiltration** — T1041 Exfiltration Over C2 Channel

## 5. 권고 사항
1. 영향받은 호스트 격리 후 메모리·디스크 이미지 추가 채증
2. \`b7e3…9d42\` 해시·C2 IP를 EDR/방화벽 차단 룰에 즉시 반영
3. 사용자 계정 Admin 비밀번호 재설정 + RDP 외부 노출 차단(NLA 강제)
4. VSS 보호: \`HKLM\\SYSTEM\\CurrentControlSet\\Services\\VSS\` ACL 강화
5. 직원 대상 피싱 시뮬레이션 및 첨부파일 실행 정책 재교육
`;

export const MOCK_REPORT_DFXML = `<?xml version="1.0" encoding="UTF-8"?>
<dfxml version="1.2" xmloutputversion="1.0">
  <metadata>
    <case_id>DF-2026-0425</case_id>
    <analyst>김영끌</analyst>
    <generated_at>2026-05-21T14:22:00Z</generated_at>
    <source_image>
      <filename>2023_KDFS.E01</filename>
      <size>53687091200</size>
      <hash type="SHA-256">7c4a9f3b1d8e2c5a6b0d4f7e1a3c5b8d2e6f9a0c3b7d1e4f5a8c2b6d9e0f3a1c</hash>
    </source_image>
  </metadata>
  <summary>
    <total_steps>10</total_steps>
    <success>10</success>
    <anomalies>23</anomalies>
    <confidence>0.97</confidence>
    <encrypted_files>142</encrypted_files>
    <deleted_vss>3</deleted_vss>
    <c2_endpoints>2</c2_endpoints>
    <exfiltrated_bytes>524288</exfiltrated_bytes>
  </summary>
  <findings>
    <finding severity="critical" attack="T1486">
      랜섬웨어 svchost32.exe 142건 파일 암호화
    </finding>
    <finding severity="critical" attack="T1490">
      vssadmin delete shadows /all로 VSS 3건 삭제
    </finding>
    <finding severity="high" attack="T1041">
      Tor exit 185.220.101.34:8443으로 524KB 전송
    </finding>
    <finding severity="high" attack="T1566.001">
      피싱 첨부 security_patch.zip (SHA-256 b7e3…9d42)
    </finding>
    <finding severity="medium" attack="T1053.005">
      WindowsUpdateCheck 지속성 작업 등록
    </finding>
  </findings>
</dfxml>`;
