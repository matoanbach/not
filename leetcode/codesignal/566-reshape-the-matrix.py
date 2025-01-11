class Solution:
    def matrixReshape(self, mat: List[List[int]], r: int, c: int) -> List[List[int]]:
        ROWS, COLS = len(mat), len(mat[0])
        if r * c != ROWS * COLS: return mat
        nums = []
        output = [[0] * c for _ in range(r)]
        for row in range(ROWS):
            for col in range(COLS):
                nums.append(mat[row][col])
        
        for row in range(r):
            for col in range(c):
                output[row][col] = nums.pop(0)
                
        return output