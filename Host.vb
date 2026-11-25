' Host adapters for the unmodified Revival core. No WinForms application is loaded.
Imports System.IO
Imports Newtonsoft.Json

Public Class Configuracion
    Public UsarProxy As Boolean = False
    Public ProxyIP As String = ""
    Public ProxyPort As Integer = 0
    Public ProxyUser As String = ""
    Public ProxyPassword As String = ""
    Public ListaPreSharedKeys As New List(Of Security.SecureString)
End Class

Public Class URLProcessor
    Public Class FileURL
        Public URL As String
        Public Path As String
        Public FolderName As String
        Public DisplayName As String
        Public SizeBytes As Long?
        Public PublicFolderParent As String
        Public PublicFolderAccountLink As String
        Public Sub New(value As String, relative As String)
            URL = value
            Path = relative
        End Sub
    End Class
End Class

' Public links use Conexion's proxy. Only the desktop application has an account session to refresh.
Friend NotInheritable Class MegaAccountService
    Friend Shared ReadOnly Current As New MegaAccountService()
    Friend Sub UpdateProxies()
    End Sub
End Class

' The worker requests files through RetrieveLinksFromFolder. These are the folder reader's
' optional subscription fields in the desktop host, which supplies a listing to ReadFolder.
Friend MustInherit Class PublicFolderListing
    Friend RootHandle As String
    Friend ShareName As String
    Friend IsComplete As Boolean = True
    Friend ReadOnly Directories As New Dictionary(Of String, PublicFolderDirectory)(StringComparer.Ordinal)
    Friend MustOverride Function FileLink(handle As String) As String
End Class

Friend NotInheritable Class PublicFolderDirectory
    Friend ReadOnly Handle As String
    Friend ReadOnly ParentHandle As String
    Friend ReadOnly Name As String
    Friend Sub New(handle As String, parentHandle As String, name As String)
        Me.Handle = handle
        Me.ParentHandle = parentHandle
        Me.Name = name
    End Sub
End Class

Friend NotInheritable Class PublicFolderUnavailableException
    Inherits ApplicationException
    Friend Sub New(message As String)
        MyBase.New(message)
    End Sub
End Class

' The headless host uses upstream fallback messages; QAQR owns UI translations.
Public Class Language
    Public Shared Function GetText(key As String) As String
        Return key
    End Function
End Class

Public Class Log
    Public Shared Sub WriteDebug(message As String)
    End Sub
    Public Shared Sub WriteInfo(message As String)
    End Sub
    Public Shared Sub WriteWarning(message As String)
        If message.Contains("download will be incomplete") Then Throw New IOException("Some shared-folder files could not be decrypted; download is incomplete.")
    End Sub
    Public Shared Sub WriteError(message As String)
    End Sub
    Public Shared Function SafeException(ex As Exception) As String
        Return ex.Message
    End Function
    Public Shared Function Redact(message As String) As String
        Return "[redacted]"
    End Function
End Class
