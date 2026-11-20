import { describe, it, expect } from 'vitest';

// Pure logic helper testing the optical loupe calculations implemented in DocumentMagnifier
export function calculateOpticalLoupeCoordinates({
  docWidth,
  docHeight,
  previewWidth,
  previewHeight,
  zoomLevel,
  mouseX,
  mouseY,
}: {
  docWidth: number;
  docHeight: number;
  previewWidth: number;
  previewHeight: number;
  zoomLevel: number;
  mouseX: number;
  mouseY: number;
}) {
  const lensWidth = Math.min(
    Math.round(previewWidth / zoomLevel),
    Math.max(Math.round(docWidth * 0.8), 60)
  );
  const lensHeight = Math.min(
    Math.round(previewHeight / zoomLevel),
    Math.max(Math.round(docHeight * 0.8), 40)
  );

  const maxLensX = Math.max(docWidth - lensWidth, 0);
  const maxLensY = Math.max(docHeight - lensHeight, 0);

  const lensX = Math.max(0, Math.min(mouseX - lensWidth / 2, maxLensX));
  const lensY = Math.max(0, Math.min(mouseY - lensHeight / 2, maxLensY));

  const lensCenterX = lensX + lensWidth / 2;
  const lensCenterY = lensY + lensHeight / 2;

  const translateX = previewWidth / 2 - lensCenterX * zoomLevel;
  const translateY = previewHeight / 2 - lensCenterY * zoomLevel;

  const percentX = docWidth ? Math.round((lensCenterX / docWidth) * 100) : 50;
  const percentY = docHeight ? Math.round((lensCenterY / docHeight) * 100) : 50;

  const isRightSide = docWidth > 0 && mouseX > docWidth / 2;
  const isBottomSide = docHeight > 0 && mouseY > docHeight / 2;

  return {
    lensWidth,
    lensHeight,
    lensX,
    lensY,
    lensCenterX,
    lensCenterY,
    translateX,
    translateY,
    percentX,
    percentY,
    isRightSide,
    isBottomSide,
  };
}

describe('Document Forensic Optical Loupe & Magnifier Logic', () => {
  const testDoc = {
    docWidth: 400,
    docHeight: 260,
    previewWidth: 320,
    previewHeight: 200,
  };

  it('calculates proper rectangular lens dimensions at 2.5x magnification', () => {
    const coords = calculateOpticalLoupeCoordinates({
      ...testDoc,
      zoomLevel: 2.5,
      mouseX: 200,
      mouseY: 130,
    });

    // 320 / 2.5 = 128px lens width
    expect(coords.lensWidth).toBe(128);
    // 200 / 2.5 = 80px lens height
    expect(coords.lensHeight).toBe(80);

    // Centered lens coordinates
    expect(coords.lensX).toBe(200 - 128 / 2); // 136
    expect(coords.lensY).toBe(130 - 80 / 2); // 90
    expect(coords.lensCenterX).toBe(200);
    expect(coords.lensCenterY).toBe(130);

    // Zoomed center formula check: (previewWidth / 2) - (lensCenterX * zoom)
    // 160 - (200 * 2.5) = 160 - 500 = -340
    expect(coords.translateX).toBe(-340);
    // 100 - (130 * 2.5) = 100 - 325 = -225
    expect(coords.translateY).toBe(-225);
  });

  it('clamps reticle lens securely to avoid boundary overflow on corners', () => {
    // Top-left boundary test (cursor near (0,0))
    const topLeft = calculateOpticalLoupeCoordinates({
      ...testDoc,
      zoomLevel: 2.0,
      mouseX: 10,
      mouseY: 10,
    });

    expect(topLeft.lensX).toBe(0);
    expect(topLeft.lensY).toBe(0);

    // Bottom-right boundary test (cursor near (400, 260))
    const bottomRight = calculateOpticalLoupeCoordinates({
      ...testDoc,
      zoomLevel: 2.0,
      mouseX: 395,
      mouseY: 255,
    });

    expect(bottomRight.lensX + bottomRight.lensWidth).toBeLessThanOrEqual(
      testDoc.docWidth
    );
    expect(bottomRight.lensY + bottomRight.lensHeight).toBeLessThanOrEqual(
      testDoc.docHeight
    );
  });

  it('accurately dynamically docks loupe in opposite quadrant so cursor is never blocked', () => {
    // Mouse in bottom-right quadrant -> loupe docks top-left
    const brMouse = calculateOpticalLoupeCoordinates({
      ...testDoc,
      zoomLevel: 3.0,
      mouseX: 350,
      mouseY: 220,
    });
    expect(brMouse.isRightSide).toBe(true);
    expect(brMouse.isBottomSide).toBe(true);

    // Mouse in top-left quadrant -> loupe docks bottom-right
    const tlMouse = calculateOpticalLoupeCoordinates({
      ...testDoc,
      zoomLevel: 3.0,
      mouseX: 50,
      mouseY: 40,
    });
    expect(tlMouse.isRightSide).toBe(false);
    expect(tlMouse.isBottomSide).toBe(false);
  });

  it('adjusts lens field-of-view inversely with higher zoom multipliers (2x to 4x)', () => {
    const at2x = calculateOpticalLoupeCoordinates({
      ...testDoc,
      zoomLevel: 2.0,
      mouseX: 200,
      mouseY: 130,
    });

    const at4x = calculateOpticalLoupeCoordinates({
      ...testDoc,
      zoomLevel: 4.0,
      mouseX: 200,
      mouseY: 130,
    });

    // Higher magnification produces a smaller, more focused reticle rectangle
    expect(at4x.lensWidth).toBeLessThan(at2x.lensWidth);
    expect(at4x.lensHeight).toBeLessThan(at2x.lensHeight);
    expect(at4x.lensWidth).toBe(80); // 320 / 4
    expect(at4x.lensHeight).toBe(50); // 200 / 4
  });

  it('computes accurate percentage telemetry readouts for external PiP HUD', () => {
    const center = calculateOpticalLoupeCoordinates({
      ...testDoc,
      zoomLevel: 2.5,
      mouseX: 200,
      mouseY: 130,
    });

    expect(center.percentX).toBe(50);
    expect(center.percentY).toBe(50);
  });

  it('supports stepped zoom intensity multipliers across [2x, 2.5x, 3x, 4x]', () => {
    const levels = [2, 2.5, 3, 4];
    levels.forEach((z) => {
      const result = calculateOpticalLoupeCoordinates({
        ...testDoc,
        zoomLevel: z,
        mouseX: 200,
        mouseY: 130,
      });

      expect(result.lensWidth).toBe(Math.round(testDoc.previewWidth / z));
      expect(result.lensHeight).toBe(Math.round(testDoc.previewHeight / z));
      expect(result.lensWidth).toBeGreaterThan(0);
      expect(result.lensHeight).toBeGreaterThan(0);
    });
  });
});
