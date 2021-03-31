export const STATES = {
    INACTIVE: 'INACTIVE',
    ACTIVE: 'ACTIVE'
}

// Converts DOMRect into plain object.
// Overflow is temporarily forced to 'hidden' to prevent margin collapse,
// and receive an accurate height/width value.
export const getBCR = $el => {
    $el.style.overflow = 'hidden'
    const {top, right, bottom, left, width, height, x, y} = $el.getBoundingClientRect()
    $el.style.overflow = null
    return {top, right, bottom, left, width, height, x, y}
}
