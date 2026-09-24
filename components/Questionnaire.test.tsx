// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Questionnaire } from '@/components/Questionnaire'

afterEach(cleanup)

function next() {
  fireEvent.click(screen.getByRole('button', { name: '다음' }))
}

// 단계 순서: houseDecided -> region -> area -> deposit
function goToDepositStep(pickRegion: boolean) {
  fireEvent.click(screen.getByRole('button', { name: '결정했어요' }))
  next()
  if (pickRegion) fireEvent.click(screen.getByRole('button', { name: '수도권' }))
  next()
  next() // area
}

describe('Questionnaire 프리필', () => {
  it('쿼리가 없으면 기존 기본값(보증금 2억, 면적 59㎡, 지역 미선택)으로 시작한다', () => {
    render(<Questionnaire onComplete={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: '결정했어요' }))
    next()
    expect(screen.getByRole('button', { name: '수도권' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: '비수도권' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: '다음' }).hasAttribute('disabled')).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '수도권' }))
    next()
    expect((screen.getByRole('slider', { name: '전용면적' }) as HTMLInputElement).value).toBe('59')
    next()
    expect((screen.getByRole('slider', { name: '전세보증금' }) as HTMLInputElement).value).toBe('20000')
  })

  it('initialValues.depositManwon으로 보증금 슬라이더가 채워진 채 시작하고 수정할 수 있다', () => {
    render(<Questionnaire onComplete={() => {}} initialValues={{ depositManwon: 15000 }} />)
    goToDepositStep(true)
    const slider = screen.getByRole('slider', { name: '전세보증금' }) as HTMLInputElement
    expect(slider.value).toBe('15000')
    expect(screen.getAllByText(/1억 5,000만원/).length).toBeGreaterThan(0)

    fireEvent.change(slider, { target: { value: '25000' } })
    expect((screen.getByRole('slider', { name: '전세보증금' }) as HTMLInputElement).value).toBe('25000')
  })

  it('initialValues.region은 미리 선택된 채 시작하고 바꿀 수 있다', () => {
    render(<Questionnaire onComplete={() => {}} initialValues={{ region: 'non-capital' }} />)
    fireEvent.click(screen.getByRole('button', { name: '결정했어요' }))
    next()
    expect(screen.getByRole('button', { name: '비수도권' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: '다음' }).hasAttribute('disabled')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: '수도권' }))
    expect(screen.getByRole('button', { name: '수도권' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: '비수도권' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('initialValues.areaSqm으로 면적 슬라이더가 채워진 채 시작한다', () => {
    render(<Questionnaire onComplete={() => {}} initialValues={{ areaSqm: 84 }} />)
    fireEvent.click(screen.getByRole('button', { name: '결정했어요' }))
    next()
    fireEvent.click(screen.getByRole('button', { name: '수도권' }))
    next()
    const slider = screen.getByRole('slider', { name: '전용면적' }) as HTMLInputElement
    expect(slider.value).toBe('84')
    fireEvent.change(slider, { target: { value: '60' } })
    expect((screen.getByRole('slider', { name: '전용면적' }) as HTMLInputElement).value).toBe('60')
  })
})
