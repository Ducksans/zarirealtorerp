@echo off
set PATH=C:\Program Files\nodejs;%PATH%
node scripts\send_telegram_alert.js "대표님, 본격적인 코딩 진입 전 DB 스키마 확정을 위해 결재를 요청합니다. CRM 영업 파이프라인(퍼널) 단계를 어떻게 구성할까요?" "[단순형] 신규접수 -> 상담중 -> 미팅 -> 계약완료" "[상세형] 신규접수 -> 1차콜 -> 현장투어 -> 가계약 -> 최종계약"
