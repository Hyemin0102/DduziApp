#!/bin/bash
set -e

PROD_REF="xjqrqnlhejslenaagnel"

echo "🚀 prod 배포 시작..."

echo "📦 마이그레이션 적용 중..."
supabase link --project-ref $PROD_REF
supabase db push

echo "⚡ Edge Functions 배포 중..."
supabase functions deploy send-report-email --project-ref $PROD_REF
supabase functions deploy send-block-email --project-ref $PROD_REF
supabase functions deploy cleanup-conflict-user --project-ref $PROD_REF

echo "✅ 배포 완료! .env를 prod 값으로 교체하는 것 잊지 마세요."
